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

var events = require('events');

function Renderer(params) {
    this.template = params.template;
    this.context = params.context;
    this.block = 0;
}

Renderer.prototype = Object.create(events.EventEmitter.prototype);

Renderer.prototype.exec = function (callback) {
    var that = this, data = '';

    // Hook convience parameter up to event emitter
    callback && this.once('done', callback);

    function defer() {
        var block;
        for (; that.block < that.template._blocks.length; that.block += 1) {
            block = that.template._blocks[that.block];
            if (block.type === 'text') {
                data += block.text;
            } else {
                return block.render(that, function (err, output) {
                    if (err) {
                        return that.emit('done', err);
                    }
                    data += output;
                    that.block += 1;
                    defer();
                });
            }
        }
        that.emit('done', false, data);
    }

    // Start rendering unless we're waiting on the template to tokenize
    if (this.template._tokenized) {
        defer();
    } else {
        this.template.once('compiled', function (err) {
            if (err) {
                that.emit('done', 'Could not render because template failed to tokenize: ' + err);
            } else {
                defer();
            }
        });
    }
};

module.exports = Renderer;

// vim: sw=4 ts=4 sts=4 et:
