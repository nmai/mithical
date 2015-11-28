'use strict'

let ejs = require('ejs')
let fs = require('fs')
//let __parent = parentDir(__dirname)
let __root = require('app-root-path').resolve('');

let app
ejs.delimiter = '%'

let template_main = fs.readFileSync('src/client/template/main.ejs', {encoding: 'UTF-8'})

module.exports = function (express_app) {
    app = express_app

    app.use(express.static(__root + '/lib_dev'));
    app.use(express.static(__root + '/src/client'));

    app.get('/', function (req, res) {
        res.send(ejs.render(template_main, {filename: 'test'} ))
    })

    // Lame
    app.get('/mithril.js', function (req, res) {
        res.sendFile(__root + '/node_modules/mithril/mithril.js')
    })
}
