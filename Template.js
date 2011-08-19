/*  This file is part of Async.Tmpl.JS.

    Copyright 2011 Ryan Munro <munro.github@gmail.com>.

    Async.Tmpl.JS is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Async.Tmpl.JS is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Async.Tmpl.JS.  If not, see <http://www.gnu.org/licenses/>.
*/

var fs = require('fs'),
    events = require('events'),
    Renderer = require('./Renderer'),
    Args = require('./Args');

function Template(params) {
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
    this.__token_regexps = [
        {type: 'seperator', regexp: new RegExp('^' +
                RegExp.escape(this._params.tokens.seperator))},
        {type: 'end', name: 'tag', regexp: new RegExp('^' +
                RegExp.escape(this._params.tokens.tag[1]))},
        {type: 'end', name: 'var', regexp: new RegExp('^' +
                RegExp.escape(this._params.tokens['var'][1]))},
        {type: 'var', regexp: /^([a-zA-Z_$][0-9a-zA-Z_$.]*)/},
        {type: 'string', regexp: /^['"]([^'"]*)['"]/}
    ];

    // Load file
    if (params.file) {
        this.loadFile(params.file);
    }

    return this;
}

Template.tags = {};
Template.filters = {};
Template.options = {
    tokens: {
        tag: ['{%', '%}'],
        'var': ['{{', '}}'],
        seperator: '|'
    },
    encoding: 'utf8'
};

Template.prototype = Object.create(events.EventEmitter.prototype);
Template.prototype.tags = Object.create(Template.tags);
Template.prototype.filters = Object.create(Template.filters);

Template.prototype.loadFile = function (file) {
    var that = this;
    fs.readFile(file, this._params.encoding, function (err, data) {
        that.tokenizeData(data);
    });
};

Template.prototype.render = function(context, callback) {
    var renderer = new Renderer({
        template: this,
        context: context
    });
    renderer.exec(callback);
    return renderer;
};

Template.prototype.tokenizeData = function (data) {
    var that = this, tokens, i, position, type, token, variable, block;

    /////////////////////////
    //////// HELPER FUNCTIONS
    /////////////////////////
    function read_variable() {
        var i, match, block;
        if (match = data.substr(position).match(/^\s+/)) {
            position += match[0].length;
        }
        for (i = 0; i < that.__token_regexps.length; i += 1) {
            if ((match = data.substr(position).match(that.__token_regexps[i].regexp))) {
                position += match[0].length;
                block = Object.create(that.__token_regexps[i]);
                block.text = match[1];
                return block;
            }
        }
        return false;
    }

    function setupFilterBlock() {
        var filter, render, i, pipe;
    
        for (i = block.filters.length - 1; i >= 0; i -= 1) {
            filter = block.filters[i];
    
            if (!(filter.name in that.filters) ||
                    Object.hasOwnProperty(filter.name)) {
                return 'Parse error: 62';
            }
    
            // Setup filter
            render = that.filters[filter.name](that, filter.args);
    
            if (typeof render !== 'function') {
                this.emit('compiled', render);
            }
    
            // Setup pipe
            pipe = (function (pipe, render) {
                return function (renderer, callback, input) {
                    render(renderer.context, input, function (err, value) {
                        if (!pipe || err) {
                            callback(err, value);
                        } else {
                            pipe(renderer, callback, value);
                        }
                    });
                };
            }(pipe, render));
        }
    
        (function (block) {
            block.render = function (renderer, callback) {
                if (pipe) {
                    pipe(renderer, callback, renderer.context[block.text],
                        callback);
                } else {
                    callback(false, renderer.context[block.text]);
                }
            };
        }(block));
    
        return false;
    }

    function setupTagBlock() {
        if (!(block.text in that.tags) || Object.hasOwnProperty(block.text)) {
            return 'Template parse error #95: Missing tag `' + block.text + '`';
        }

        block.render = (function (tag) {
            return function (renderer, callback) {
                //callback(false, 'weeeee');
                tag(renderer, renderer.context, callback);
            };
        }(that.tags[block.text](that, block.args)));
    }

    /////////////////////////////////////////////
    // Find all possible starting token positions
    /////////////////////////////////////////////
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
        (this._params.tokens.tag[0])
        (this._params.tokens['var'][0]));
    tokens.sort(function (a, b) {
        return a > b;
    }); // .sort().reverse() was not returning the list in ascending order

    ///////////////////////
    ///// Parse expressions
    ///////////////////////
    this._blocks = [];
    position = 0;
    for (i = 0; i < tokens.length; i += 1) {
        // Skip to next token
        if (position > tokens[i]) {
            continue;
        } else {
            if (tokens[i] - position) {
                this._blocks.push({
                    type: 'text',
                    text: data.substr(position, tokens[i] - position)
                });
            }
            position = tokens[i];
        }

        // Parse token type
        token = this._params.tokens.tag[0];
        type = (data.substr(position, token.length) === token) ? 'tag': 'var';

        // Parser
        position += this._params.tokens[type][0].length;
        block = {
            type: type
        };
        while (variable = read_variable()) {
            ///////////////////
            // Var/Filter rules
            ///////////////////
            if (block.type === 'var') {
                // First variable must be a var
                if (!block.text) {
                    if (variable.type !== 'var') {
                        return this.emit('compiled', 'Parse error: 55');
                    }
                    block.text = variable.text;
                // Ending block
                } else if (variable.type === 'end') {
                    if (variable.name !== 'var') {
                        return this.emit('compiled', 'Parse error: 56');
                    } else if (block.filters &&
                            !block.filters[block.filters.length - 1].name) {
                        return this.emit('compiled', 'Parse error: 58');
                    }
                    break;
                // Start filter list
                } else if (!block.filters) {
                    if (variable.type !== 'seperator') {
                        return this.emit('compiled', 'Parse error: 57');
                    }
                    block.filters = [{}];
                // Next filter
                } else if (variable.type === 'seperator') {
                    if (!block.filters[block.filters.length - 1].name) {
                        return this.emit('compiled', 'Parse error: 59');
                    }
                    block.filters.push({});
                // Set filter name
                } else if (!block.filters[block.filters.length - 1].name) {
                    if (variable.type !== 'var') {
                        return this.emit('compiled', 'Parse error: 60');
                    }
                    block.filters[block.filters.length - 1].name =
                            variable.text;
                    block.filters[block.filters.length - 1].args = new Args();
                // Push filter argument
                } else {
                    block.filters[block.filters.length - 1].args.push(variable);
                }
            ////////////
            // Tag rules
            ////////////
            } else if (block.type === 'tag') {
                if (!block.text) {
                    if (variable.type !== 'var') {
                        return this.emit('compiled', 'Parse error: 91');
                    }
                    block.text = variable.text;
                    block.args = new Args();
                // Ending block
                } else if (variable.type === 'end') {
                    if (variable.name !== 'tag') {
                        return this.emit('compiled', 'Parse error: 92');
                    }
                    break;
                // No seperators allowed!
                } else if (variable.type === 'seperator') {
                    return this.emit('compiled', 'Parse error: 93');
                // Push variables on the arg list
                } else {
                    block.args.push(variable);
                }
            }
        }
        if (block.type === 'var') {
            var parse_error;
            if (parse_error = setupFilterBlock()) {
                return this.emit('compiled', parse_error);
            }
        } else if (block.type === 'tag') {
            if (parse_error = setupTagBlock()) {
                return this.emit('compiled', parse_error);
            }
        }
        this._blocks.push(block);
        if (variable === false) {
            this.emit('compiled', 'Parse error: no ending ' + type +
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

module.exports = Template;

// vim: sw=4 ts=4 sts=4 et:
