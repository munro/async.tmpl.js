var fs = require('fs'),
    events = require('events'),
    Renderer = require('./Renderer');

function Template(params) {
    // Construct thisect
    var that = this;

    // Set properties
    this.file = params.file;
    this._tokenized = false;
    this._params = {
        tokens: {
            'tag': ['{%', '%}'],
            'var': ['{{', '}}'],
            'seperator': '|'
        },
        encoding: 'utf8'
    }; // .merge(params);

    // Load file
    if (params.file) {
        this.loadFile(params.file);
    }

    // Setup renderer constructor
    this.Renderer = function (context) {
        Renderer.call(this, {
            template: that,
            context: context
        });
    };
    this.Renderer.prototype = Renderer.prototype;

    return this;
}

Template.prototype = Object.create(events.EventEmitter.prototype);

Template.prototype.loadFile = function (file) {
    var that = this;
    fs.readFile(file, this._params.encoding, function (err, data) {
        that.tokenizeData(data);
    });
};

Template.prototype.tokenizeData = function (data) {
    var that = this, tokens, data, i, position, type, token;

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
        (this._params.tokens['tag'][0])
        (this._params.tokens['var'][0]));
    tokens.sort();

    // Parse expressions
    this._blocks = [];
    position = 0;
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
        token = this._params.tokens['tag'][0];
        type = (data.substr(position, token.length) === token) ? 'tag': 'var';

        // Helper functions
        function skip_whitespace() {
            var whitespace = data.substr(position).match(/^\s+/);
            if (whitespace) {
                position += whitespace.length;
            }
        }
        function read_variable() {
            var match, token;
            skip_whitespace();
            if ((token = that._params.tokens['seperator']) &&
                    data.substr(position, token.length) === token) {
                position += that._params.tokens['seperator'].length;
                return {type: 'seperator'};
            } else if ((token = that._params.tokens['tag'][1]) &&
                    data.substr(position, token.length) === token) {
                position += that._params.tokens['tag'][1].length;
                return {type: 'end', name: 'tag'};
            } else if ((token = that._params.tokens['var'][1]) &&
                    data.substr(position, token.length) === token) {
                position += that._params.tokens['tag'][1].length;
                return {type: 'end', name: 'var'};
            } else if (match =
                    data.substr(position).match(/^[a-zA-Z_$][0-9a-zA-Z_$.]*/)) {
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
        while (variable = read_variable()) {
            if (variable.type === 'end') {
                if (variable.name === type) {
                    this._blocks.push(block);
                    break;
                } else {
                    this.emit('compiled',
                            'Parsing error: found incorrect end token type.');
                    return;
                }
            } else {
                block.variables.push(variable);
            }
        }
        if (variable === false) {
            this.emit('compiled', 'Parsing error: no ending ' + type +
                    ' token.');
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
};


//////////
// Plugins
//////////
Template.tags = {};
Template.tags.echo = function (template, args) {
    return function (renderer, ctx, next) {
        renderer.write('echo' + args);
        next();
    };
}
Template.filters = {};
Template.filters.upper = function (template, args) {
    return function (ctx, input, output) {
        output(false, input.toUpperCase());
    };
}

//////////
// Testing
//////////
var tmpl = new Template({file: 'echo.html'});

tmpl.on('compiled', function (err, blocks) {
    if (err) {
        console.log('Parsing error: ', err)
    } else {
        console.log(blocks);
    }
});

var renderer = new tmpl.Renderer({hello: 'WA WA WORLD'});

renderer.exec(function (err, data) {
    console.log(err || data);
});

// vim: sw=4 ts=4 sts=4 et:
