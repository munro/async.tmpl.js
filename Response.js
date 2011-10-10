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

var EventEmitter = require('events').EventEmitter;

function Response(params) {
    EventEmitter.call(this);
    this.parts = [];
    this.defers = [];
    this.ended = false;
}

Response.prototype = Object.create(EventEmitter.prototype);

Response.prototype.push = function (data) {
    this.parts.push(data);
    if (this.defer_count === 0) {
        this.emit('data', data); // TODO: combine emits
    }
};

Response.prototype.deferPush = function () {
    var that = this, i = this.parts.length;

    this.parts.push(null);
    this.defers.push(i);

    return function (data) {
        that._deferPushCallback(i, data);
    };
};

Response.prototype._deferPushCallback = function (index, data) {
    var i, max;

    this.parts[index] = data;

    if (this.defers[0] === i) {
        this.defers = this.defers.slice(1);
        max = this.defers[0] || this.parts.length;
        for (i = index; i < max; i += 1) {
            this.emit('data', this.parts[i]); // TODO: combine emits
        }
    } else {
        this.defers = this.defers.filter(function (index) {
            return index !== i;
        });
    }

    if (this.ended) {
        this.end();
    }
};

Response.prototype.end = function () {
    if (this.defers.length === 0) {
        this.emit('end');
    } else {
        this.ended = true;
    }
};

// vim: sw=4 ts=4 sts=4 et:
