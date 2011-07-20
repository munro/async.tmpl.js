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

var Template = require('./Template');

function createTemplate(args) {
    var current = Object.create(Template.prototype);
    Template.apply(current, args);
    return current;
}

function TemplateWatcher(params) {
    var that = this;

    this._current = createTemplate(arguments);

    if (params.file) {
        // Watch file for changes!!
        function () {
            this._current = createTemplate(arguments);
            //this._templates.push(_current);
        }
    }

    this._current = current;
    //this._templates = [current];
}

Template.tags = {};
Template.filters = {};

// Forward Template methods to current template
for(var key in Template.prototype) {
    if (!Object.prototype.hasOwnProperty(key) &&
            typeof Template.prototype[key] === 'function') {
        (function (key) {
            TemplateWatcher.prototype[key] = function () {
                this._current[key].apply(this, arguments);
            };
        }(key));
    }
}
