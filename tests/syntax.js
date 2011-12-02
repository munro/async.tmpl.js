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
    function invalidNumber(str, parsed) {
        var helper = matchHelper({
            fn: syntax.matchNumber,
            input: str,
            output: (parsed ? {
                type: 'number',
                value: eval(parsed)
            } : false)
        });
        if (parsed) {
            assert.equal(helper.parser.position, parsed.length);
        } else {
            helper.atStart();
        }
    }
    validNumber('-0');
    validNumber('-5');
    validNumber('-10');
    validNumber('-9284');
    validNumber('-0.');
    validNumber('-6.');
    validNumber('-23.');
    validNumber('-8439.');
    validNumber('-984.');
    validNumber('-1.2345');
    validNumber('-5.000');
    validNumber('-23.411');
    validNumber('-8439.023');
    validNumber('-984.0');
    validNumber('-.2345');
    validNumber('-.000');
    validNumber('-.411');
    validNumber('-.023');
    validNumber('-.0');
    validNumber('-0e+12');
    validNumber('-5e+1');
    validNumber('-10e-12');
    validNumber('-9284e+12');
    validNumber('-0.e-1');
    validNumber('-6.e+12');
    validNumber('-23.e+12');
    validNumber('-8439.e-1');
    validNumber('-984.e+12');
    validNumber('-1.2345e-12');
    validNumber('-5.000e+1');
    validNumber('-23.411e-12');
    validNumber('-8439.023e+12');
    validNumber('-984.0e-1');
    validNumber('-.2345e+12');
    validNumber('-.000e+1');
    validNumber('-.411e-12');
    validNumber('-.023e+12');
    validNumber('-.0e-1');
    validNumber('-0xffef');
    validNumber('-0xFfEf');
    validNumber('-0x0');
    validNumber('-0x0123456789abcdef');
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
    validNumber('.2345');
    validNumber('.000');
    validNumber('.411');
    validNumber('.023');
    validNumber('.0');
    validNumber('0e+12');
    validNumber('5e+1');
    validNumber('10e-12');
    validNumber('9284e+12');
    validNumber('0.e-1');
    validNumber('6.e+12');
    validNumber('23.e+12');
    validNumber('8439.e-1');
    validNumber('984.e+12');
    validNumber('1.2345e-12');
    validNumber('5.000e+1');
    validNumber('23.411e-12');
    validNumber('8439.023e+12');
    validNumber('984.0e-1');
    validNumber('.2345e+12');
    validNumber('.000e+1');
    validNumber('.411e-12');
    validNumber('.023e+12');
    validNumber('.0e-1');
    validNumber('0xffef');
    validNumber('0xFfEf');
    validNumber('0x0');
    validNumber('0x0123456789abcdef');
    validNumber('Infinity');
    validNumber('-Infinity');

    // NaN
    var parser = new Parser('NaN');
    var obj = syntax.matchNumber(parser);
    assert.equal(typeof obj, 'object');
    assert.equal(isNaN(obj.value), true);
    assert.equal(parser.position, 3);

    parser = new Parser('-NaN');
    obj = syntax.matchNumber(parser);
    assert.equal(typeof obj, 'object');
    assert.equal(isNaN(obj.value), true);
    assert.equal(parser.position, 4);

    invalidNumber('');
    invalidNumber('.');
    invalidNumber('00', '0');
    invalidNumber('01', '0');
    invalidNumber('004830', '0');
    invalidNumber('00.', '0');
    invalidNumber('01.', '0');
    invalidNumber('004830.', '0');
    invalidNumber('00.0123', '0');
    invalidNumber('01.582', '0');
    invalidNumber('004830.0', '0');
    invalidNumber('-');

    // switch to samples! it's simplier
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

exports['test syntax#matchString'] = function () {
    function validString(str, str2) {
        var parser = new Parser(str);
        assert.eql(syntax.matchString(parser), {
            type: 'string',
            text: str2
        });
    }
    function sl(str) {
        return str.replace(/%/g, '\\').replace(/\^/g, '\'');
    }
    validString(sl("^hello %% world %%%% rwar^"), sl('hello % world %% rwar'));
    validString(sl("^hello %%^"), sl('hello %'));
    validString(sl("^hello %n world^"), sl('hello \n world'));
    validString(sl("^hello % world^"), sl('hello  world')); // having a single \ is weird
    validString(sl("^hello %^, 1337 //^"), 'hello \', 1337 //');
    validString("'hello world\\' rawr \\'\\' foo'", 'hello world\' rawr \'\' foo');
    validString("'hello \\\\ world'", 'hello \\ world');
    validString("'hello world'", 'hello world');
    validString("'hello \\' world'", 'hello \' world');
};
