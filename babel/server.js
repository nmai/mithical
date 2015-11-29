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

    app.use(express.static(__root + '/lib_dev'));
    app.use(express.static(__root + '/src/client'));

    app.get('/', function (req, res) {
        res.send(ejs.render(template_main, { filename: 'test' }));
    });

    // Lame
    app.get('/mithril.js', function (req, res) {
        res.sendFile(__root + '/node_modules/mithril/mithril.js');
    });
};