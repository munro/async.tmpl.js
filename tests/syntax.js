var assert = require('assert'),
    Parser = require('../parser').Parser,
    syntax = require('../syntax');

function matchHelper(options) {
    var parser = new Parser(options.input);

    assert.eql(options.fn.apply(global, [parser].concat(options.args || [])),
        options.output);

    return {
        parser: parser,
        atEnd: function () {
            assert.equal(parser.position, options.input.length);
        },
        atStart: function () {
            assert.equal(parser.position, 0);
        },
        hasError: function () {
            assert.isDefined(parser.error);
        }
    };
}

exports['test syntax#match'] = function () {
    assert.equal('foo', 'foo');
};

exports['test syntax#matchText'] = function () {
    var helper = matchHelper({
        fn: syntax.matchText,
        args: ['hello'],
        input: 'hello',
        output: {
            type: 'text',
            text: 'hello'
        }
    });
    helper.atEnd();
};

exports['test syntax#matchNull'] = function () {
    var helper = matchHelper({
        fn: syntax.matchNull,
        input: 'null  extra',
        output: {
            type: 'null',
            literal: true
        }
    });
    assert.equal(helper.parser.position, 4);
};

exports['test syntax#matchNumber'] = function () {
    function validNumber(str) {
        var helper = matchHelper({
            fn: syntax.matchNumber,
            input: str,
            output: {
                type: 'number',
                value: eval(str)
            }
        });
        helper.atEnd();
    }
    validNumber('0');
    validNumber('5');
    validNumber('10');
    validNumber('9284');
    validNumber('0.');
    validNumber('6.');
    validNumber('23.');
    validNumber('8439.');
    validNumber('984.');
    validNumber('1.2345');
    validNumber('5.000');
    validNumber('23.411');
    validNumber('8439.023');
    validNumber('984.0');
    invalidNumber('.');
    invalidNumber('00');
    invalidNumber('01');
    invalidNumber('004830');
    invalidNumber('00.');
    invalidNumber('01.');
    invalidNumber('004830.');
    invalidNumber('00.0123');
    invalidNumber('01.582');
    invalidNumber('004830.0');
    var samples = {
        valid: {
            number: ['', '0', '10', '29', '483', '900'],
            decimal: ['', '0', '000', '4', '10', '55', '2843'],
            exponent: ['e+0', 'e-0', 'e+1', 'e-5', 'e+100', 'e-433']
        },
        invalid: {
            number: ['00', '01', '001392']
        }
    };
};
