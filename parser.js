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

/**
 * SyntaxError
 *
 * @param parser Parser object, used to generate a trace
 * @param message Description of the error
 */
function SyntaxError(parser, message) {
    this.position = parser.position;
    this.message = message || 'undefined syntax error';
    this.trace = '';
    var after = parser.template.substr(parser.position).split('\n')[0],
        before = parser.template.substr(0, parser.position).split('\n');
    before = before[before.length - 1];

    this.trace = before + after + '\n';
    for (var i = 0; i < before.length; i += 1) {
        this.trace += ' ';
    }
    this.trace += '^\n';
    this.trace += this.name + ': ' + this.message[0].toUpperCase() + this.message.substr(1);
}
exports.SyntaxError = SyntaxError;

SyntaxError.prototype.name = 'SyntaxError';

/**
 * Parser
 *
 * @param template String containg the Feather.js template
 */
function Parser(template, options) {
    this.template = template;
    this.code = template;
    this.position = 0;
    this.errors = [];
    this.error = false;

    // Put this in a util module, never surrend to underscore!
    if (options) {
        for (var key in Parser.prototype.options) {
            if (Parser.prototype.options.hasOwnProperty(key) &&
                    !options.hasOwnProperty(key)) {
                options[key] = Parser.prototype.options[key];
            }
        }
    }
}
exports.Parser = Parser;

/**
 * Parser.prototype.match
 *
 * @param regexp String containing a regular expression match next.
 * @param err_message Error message to throw if the syntax cannot be matched.
 * @param callback Map function to wrap the successful match.  Recieves the
 *                 matched string, and is expected to return a syntax object.
 * @return Object False if failed, otherwise the mapped matched.
 */
Parser.prototype.match = function (regexp, err_message, callback) {
    var match = false;

    if (regexp instanceof RegExp) {
        match = this.code.match(new RegExp('^' + regexp));
        match = (match ? match[0] : false);
    } else if (typeof regexp === 'string' && regexp === this.code.substr(0, regexp.length)) {
        match = regexp;
    }

    if (match === false) {
        this.error = new SyntaxError(this, err_message);
        this.errors.push(this.error);
        return false;
    } else if (callback) {
        this.error = false;
        this.errors = [];
        this.position += match.length;
        this.code = this.code.substr(match.length);
        return callback(match);
    }
};

/**
 * Parser.prototype.options
 * Default options
 */
Parser.prototype.options = {
    tag: ['{%', '%}'],
    val: ['{{', '}}'],
    comment: ['{#', '#}']
};

/**
 * Parser.prototype.fork
 *
 * @return A delegated copy of the current parser.
 */
Parser.prototype.fork = function () {
    return Object.create(this);
};

/**
 * Parser.prototype.join
 *
 * @param parser The parser object to copy from.
 */
Parser.prototype.join = function (parser) {
    this.code = parser.code;
    this.position = parser.position;
};
