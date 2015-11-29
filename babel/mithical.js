'use strict';

var ejs = require('ejs');
var fs = require('fs');
//let __parent = parentDir(__dirname)
var __root = require('app-root-path').resolve('');

var app = /*THIS IS OUTPUT FROM THE BABEL TRANSPILER. Edit the ES6 source in /src instead.*/undefined;
ejs.delimiter = '%';

var template_main = fs.readFileSync('src/client/template/main.ejs', { encoding: 'UTF-8' });

module.exports = function (express_app) {
    app = express_app;

    app.get('/', function (req, res) {
        res.send(ejs.render(template_main, { filename: 'test' }));
    });

    // Lame
    app.get('/mithril.min.js', function (req, res) {
        res.sendFile(__root + '/node_modules/mithril/mithril.min.js');
    });
    app.get('/progressbar.js', function (req, res) {
        res.sendFile(__root + '/lib_dev/progressbar.js');
    });
    app.get('/mithical.js', function (req, res) {
        res.sendFile(__root + '/src/client/script.js');
    });
};

// @todo: for cleanup. unnecessary now.
// I don't know why the hell this is necessary but I have no internet right now.
// Simply using `__dirName + '/../asdf'` fails. Console output says FORBIDDEN
function parentDir(dirname) {
    // Parent dir will be an empty string unless '/' can be found
    var pDir = '';
    if (dirname) {
        var i = dirname.lastIndexOf('/');
        if (i < 0) {
            console.log('1');
            return pDir;
        }
        pDir = dirname;
        if (i >= dirname.length - 1) {
            if (dirname.length === 1) {
                return '/';
            } else {
                pDir = pDir.substring(0, i);
            }
        }
        pDir = pDir.substring(0, i);
        i = dirname.lastIndexOf('/');
        if (i < 0) {
            // You suck.
            return '';
        } else {
            // Ah yes, finally.
            return pDir.substring(0, i);
        }
    } else {
        return pDir;
    }
}