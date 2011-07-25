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

require('./util');

var Template = require('./Template');

require('./stdlib')(Template);
module.exports = Template;

//////////
// Testing
//////////
function main() {
    var tmpl, renderer;

    // Compile template
    tmpl = new Template({file: 'echo.html'});

    tmpl.on('compiled', function (err) {
        err && console.log(err);
    });

    // Render template
    renderer = new tmpl.Renderer({hello: 'wa wa world'});
    
    renderer.exec(function (err, data) {
        console.log(err || data);
    });
}
(require.main === module) && main();

// vim: sw=4 ts=4 sts=4 et:
