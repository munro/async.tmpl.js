# Feather.js

## Syntax

        {% for item, key in list %}
        {% endfor %}

        {{ variable }}
        {{ obj.var }}
        {{ obj['var'] | filter | join(', ') }}

        {% if loop.index is divisibleby 3 %}
        {% if loop.index is divisibleby(3) %}

        {% set row_class = cycler('odd', 'even') %}
        {{ row_class.next() %}

        {% for blah in hello.callback() %}

        {% set meow = defer hello.callback %}

        {% for blah in defer hello.callback %}

        {% for blah in stream hello.stream %}

        {{ meow }}

### Literals

#### Numbers

        100.0
        12.5e+4
        0xffff

#### Strings

        'hello \' world'

#### Null

        null

#### Booleans

        true
        false

#### Arrays

        [literal, literal, literal]

#### Objects

        {foo: 'bar', hey: 123}

## Batteries

http://jinja.pocoo.org/docs/templates/#builtin-tests
http://jinja.pocoo.org/docs/templates/#list-of-global-functions



<!-- var start -->
hello
{{ hello | upper }}{{ hello | upper | concat 'foo bar'  'rawr'  }}
wa
{{ hello | upper | concat hello 'hey' }}
world
<!-- var end -->


{% if test %}
DO THIS
% else %}
DO THAT
% endif %}


<!-- tag start -->
{% echo 'woooo' hello 'wut' %}
<!-- tag end -->
