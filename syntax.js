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

var Parser = require('./parser').Parser;

var logPipe = exports.logPipe = function (data) {
    console.log(data);
    return data;
};

/*** Syntax ***/
var matchAnyWhitespace = exports.matchAnyWhitespace = function (parser) {
    return parser.match(/^[ \n\t\r]*/, '', function () {
        return {
            type: 'any-whitespace'
        };
    });
};

var matchWhitespace = exports.matchWhitespace = function (parser) {
    return parser.match(/^[ \n\t\r]+/, 'expected whitespace', function () {
        return {
            type: 'whitespace'
        };
    });
};

var matchText = exports.matchText = function (parser, str) {
    return parser.match(str, 'expected literal `' + str + '`', function (match) {
        return {
            type: 'text',
            text: match
        };
    });
};

/* Literals */
var matchNull = exports.matchNull = function (parser) {
    var match;
    if ((match = matchText(parser, 'null'))) {
        return {
            type: 'null',
            literal: true
        };
    } else {
        parser.error = new SyntaxError(parser, 'expected null');
        return false;
    }
};

var matchBoolean = exports.matchBoolean = function (parser) {
    var bool;
    if ((bool = matchText('true')) || (bool = matchText('false'))) {
        return {
            type: 'boolean',
            literal: true,
            text: bool.text
        };
    } else {
        parser.error = new SyntaxError(parser, 'expected boolean');
    }
};

var matchNumber = exports.matchNumber = function (parser) {
    var match, eval_str;
    // Decimal
    console.log(parser.code);
    if ((match = parser.match(/^([1-9][0-9]*|0)(\.[0-9]+|\.)?/)) !== false) {

        eval_str = match;
        // Scientific Notation
        if ((match = parser.match(/e[+\-]([1-9][0-9]*|0)/)) !== false) {
        } else {
        }
    // Hexidecimal
    } else if ((match = parser.match(/^0x[A-Fa-f0-9]\+/)) !== false) {
        eval_str = match;
    } else {
        parser.error = new SyntaxError(parser, 'expected number');
        return false;
    }

    // NaN
    // Infinity
    parser.error = false;

    return {
        type: 'number',
        value: eval(eval_str)
    };
};

var matchObjectFn = exports.matchObjectFn = function (parser, test) {
};

var matchObject = exports.matchObject = function () {
};

var matchLiteralObject = exports.matchLiteralObject = function () {
};

var matchArrayFn = exports.matchArrayFn = function () {
};

var matchArray = exports.matchArray = function () {
};

var matchLiteralArray = exports.matchLiteralArray = function () {
};

var matchLiteral = exports.matchLiteral = function () {
};

/* Variables */
var matchVariableName = exports.matchVariableName = function (parser) {
    return parser.match(/^[a-zA-Z_$][0-9a-zA-Z_$]*/, 'Expected single variable', function (match) {
        return {
            type: 'variable-name',
            text: match
        };
    });
};

/**
 * matchVariable
 *
 * @todo Match `hello['rwar'][var]` syntax
 * @param parser
 * @return {
 *     type: 'variable',
 *     text: ['VAR1', 'VAR2', ...]
 * }
 */
var matchVariable = exports.matchVariable = function (parser) {
    var fork, match, vars = [];

    if ((match = matchVariableName(parser))) {
        vars.push(match.text);

        fork = parser.fork();
        while (true) {
            if (matchText(fork, '\\.') &&
                (match = matchVariableName(fork))) {
                parser.join(fork);
                vars.push(match.text);
            } else {
                break;
            }
        }

        return {
            type: 'variable',
            text: vars
        };
    } else {
        // The error message from `matchVariableName` is sufficient
    }
};

/* Expression */

/* Sugar Syntax */
var matchKeyValue = exports.matchKeyValue = function (parser) {
    var var1, var2;
    if ((var1 = matchVariableName(parser))) {
        var fork = parser.fork();
        if (matchAnyWhitespace(fork) &&
            matchText(fork, ',') &&
            matchAnyWhitespace(fork) &&
            (var2 = matchVariableName(fork))) {
            parser.join(fork);
            return {
                type: 'key-value',
                key: var1.text,
                value: var2.text
            };
        } else {
            return {
                type: 'key-value',
                key: false,
                value: var1.text
            };
        }
    }
};


/*** Rules ***/
var matchFor = exports.matchFor = function (parser) {
    var key_value, obj;
    if (matchAnyWhitespace(parser) &&
        matchText(parser, 'for') &&
        matchWhitespace(parser) &&
        (key_value = matchKeyValue(parser)) &&
        matchWhitespace(parser) &&
        matchText(parser, 'in') &&
        matchWhitespace(parser) &&
        (obj = matchVariable(parser))) {
        return {
            type: 'for',
            key: key_value.key,
            value: key_value.value,
            'object': obj
        };
    } else {
        console.log('ERROR', parser.error);
        //this.error.message = 'invalid for statement: ' + this.error.message;
    }
};

// Testing
if (false) {
var str = ' hello world \n' +
          '  for meow.hello \n' +
          'for hey, forl  in rwar';

var parser = new Parser(str);

//parser.match(' hello');
if (logPipe(matchAnyWhitespace(parser)) &&
    logPipe(matchText(parser, 'hello')) &&
    logPipe(matchWhitespace(parser)) &&
    logPipe(matchText(parser, 'world'))) {
    console.log('Woot!');
} else {
    console.log(parser.error.trace);
}
parser.fork();

logPipe(matchWhitespace(parser));
logPipe(matchVariableName(parser));
logPipe(matchWhitespace(parser));
logPipe(matchVariable(parser));

logPipe(matchWhitespace(parser));
logPipe(matchFor(parser));
console.log(parser.error.trace);
}
