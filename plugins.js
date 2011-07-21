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

module.exports = function (Template) {
    Template.tags.echo = function (template, args) {
        return function (renderer, ctx, next) {
            renderer.write('echo' + args);
            next();
        };
    };

    Template.filters.concat = function (template, args) {
        return function (ctx, input, output) {
            output(false, input + args.parse(ctx).join(''));
        };
    };

    Template.filters.upper = function (template, args) {
        return function (ctx, input, output) {
            output(false, input.toUpperCase());
        };
    };

    Template.filters.lower = function (template, args) {
        return function (ctx, input, output) {
            output(false, input.toLowerCase());
        };
    };
};

// vim: sw=4 ts=4 sts=4 et:
