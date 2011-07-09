var fs = require('fs'),
        events = require('events');

function Template(params) {
    // Construct object
    var obj = Object.create(Template.prototype);

    // Set properties
    obj.file = params.file;
    obj._tokenized = false;
    obj._render_queue = [];
    obj._params = {
        tag_tokens: ['{%', '%}'],
        var_tokens: ['{{', '}}'],
        tokens: {
            'tag': ['{%', '%}'],
            'var': ['{{', '}}'],
            'seperator': '|'
        },
        encoding: 'utf8'
    }; // .merge(params);

    // Load file
    if (params.file) {
        obj.loadFile(params.file);
    }

    return obj;
}

Template.prototype = Object.create(events.EventEmitter.prototype);

Template.prototype.loadFile = function (file) {
    var that = this;
    fs.readFile(file, this._params.encoding, function (err, data) {
        that.tokenizeData(data);
    });
};

Template.prototype.tokenizeData = function (data) {
    var that = this, tokens, data, i;

    // Find all possible starting token positions
    tokens = [];
    (function callee(token) {
        var split_tokens = data.split(token), position = 0, i;
        for (i = 0; i < split_tokens.length - 1; i += 1) {
            position += split_tokens[i].length;
            tokens.push(position);
            position += token.length;
        }
        return callee;
    }
        (this._params.tag_tokens[0])
        (this._params.var_tokens[0]));
    tokens.sort();

    // Parse expressions
    this._blocks = [];

    var position = 0, type;
    for (i = 0; i < tokens.length; i += 1) {
        // Skip to next token
        if (position >= tokens[i]) {
            continue;
        } else {
            this._blocks.push({
                type: 'text',
                text: data.substr(position, tokens[i] - position)
            });
            position = tokens[i];
        }

        // Parse token type
        type = (data.substr(position, this._params.tag_tokens[0].length) == this._params.tag_tokens[0]) ? 'tag' : 'var';

        // Helper functions
        function skip_whitespace() {
            var whitespace = data.substr(position).match(/^\s+/);
            if (whitespace) {
                position += whitespace.length;
            }
        }
        function read_var() {
            var match, token;
            skip_whitespace();
            if ((token = that._params.tokens['seperator']) &&
                    data.substr(position, token.length) === token) {
                position += that._params.tokens['seperator'].length;
                return {type: 'seperator'};
            } else if (data.substr(position, that._params.tag_tokens[1].length) == that._params.tag_tokens[1]) {
                position += that._params.tag_tokens[1].length;
                return {type: 'end', name: 'tag'};
            } else if (data.substr(position, that._params.var_tokens[1].length) == that._params.var_tokens[1]) {
                position += that._params.tag_tokens[1].length;
                return {type: 'end', name: 'var'};
            } else if (match = data.substr(position).match(/^[a-zA-Z_$][0-9a-zA-Z_$.]*/)) {
                position += match[0].length;
                return {
                    type: 'var',
                    text: match[0]
                };
            } else {
                return false;
            }
        }

        // Parser
        var variable, block;
        position += this._params.tokens[type][0].length;
        block = {
            type: type,
            variables: []
        };
        while (variable = read_var()) {
            if (variable.type === 'end') {
                if (variable.name === type) {
                    this._blocks.push(block);
                    break;
                } else {
                    this.emit('compiled', 'Parsing error: found incorrect end token type.');
                    return;
                }
            } else {
                block.variables.push(variable);
            }
        }
        if (variable === false) {
            this.emit('compiled', 'Parsing error: no ending ' + type + ' token.');
        }

    }

    if (data.length > position) {
        this._blocks.push({
            type: 'text',
            text: data.substr(position)
        });
    }

    this._tokenized = true;
    this.emit('compiled', false, this._blocks);
    this._render_queue.forEach(function (renderer) {
            renderer.execute();
    });
};

// Playing with template tags
Template.tags = {};
Template.tags['for'] = function (template) {

    // hallo
    return {
        render: function (renderer, index) {
        }
    };
};

///////////
// Renderer
///////////
function Renderer(params) {
    this.template = params.template;
    this.context = params.context;
    this.block = 0;
}

Renderer.prototype = Object.create(events.EventEmitter.prototype);

Renderer.prototype.execute = function () {
    console.log('fuck yeah');
    var that = this;
    (function next() {
        var block = that.template._blocks[that.block];
        if (block) {
            //block.render();
            console.log(block.type);
            that.block += 1;
            next();
        } else {
            that.emit('end');
        }
    }());
};

Template.prototype.render = function (context) {
    var renderer = new Renderer({template: this, context: context});

    if (this._tokenized) {
        // Allow them to set EventEmitter callbacks first
        setTimeout(function () {
            renderer.execute();
        }, 0);
    } else {
        this._render_queue.push(renderer);
    }

    return renderer;
};

//////////
// Testing
//////////
var tmpl = Template({file: 'tmpl.html'});
tmpl.on('compiled', function (err, blocks) {
    if (err) {
        console.log('Parsing error: ', err)
    } else {
        console.log(blocks);
    }
});

var renderer = tmpl.render();
//renderer.on('data', function (err, data) {
//});

// vim: sw=4 ts=4 sts=4 et: