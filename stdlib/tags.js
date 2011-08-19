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
        return function (renderer, ctx, output) {
            output(false, 'echo ' + args.parse(ctx).join());
        };
    };

    Template.tagsz = {};
    Template.tagsz['if'] = function (template, args) {
        var i, block, if_count = 0, else_block = null, end_block = null;
        for (i = this.index; i < template.blocks.length; i += 1) {
            block = template.blocks[i];
            if (block.name === 'if') {
                if_count += 1;
            } else if (block.name === 'else' && !else_block && !if_count) {
                else_block = block;
            } else if (block.name === 'endif') {
                if (if_count) {
                    if_count -= 1;
                } else {
                    end_block = block;
                    break;
                }
            }
        }
        if (!end_block) {
            return this.renderer('Missing endif');
        }
        var sub_template = Object.create(template);
        sub_template.blocks = sub_template.blocks.slice(this.index,
                (else_block || end_block).index);
        this.renderer(false, function (renderer, ctx) {
            var that = this;
            sub_template.render(ctx, function (err, value) {
                that.output(err, value);
            });
            this.next(template.blocks[end_block.index + 1]);
        });
    };
    /*Template.tags['else'] = function (template, args) {
        return function (renderer, ctx, output) {
            output(false, 'echo ' + args.parse(ctx).join());
        };
    };
    Template.tags['endif'] = function (template, args) {
        return function (renderer, ctx, output) {
            output(false, 'echo ' + args.parse(ctx).join());
        };
    };*/
};

// vim: sw=4 ts=4 sts=4 et:
