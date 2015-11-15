'use strict'

let ejs = require('ejs')
let app
ejs.delimiter = '%'

let head = '<head><script src="/mithril.min.js"></script><script src="/progressbar.js"></script></head>'
let part_header = '<div>Hello, this is the header</div>'
let part_footer = '<script src="/mithical.js"></script>'
let part_body = '<style>#container: {width: 300px;height: 150px;}</style>'
let template_body = '<%- head -%><%- header -%><%- body -%><%- footer -%>'

module.exports = function (express_app) {
    app = express_app

    app.get('/', function (req, res) {
    res.send(ejs.render(template_body, 
        {head: head, header: part_header, body: part_body, footer: part_footer}))
    })
    app.get('/mithril.min.js', function (req, res) {
        res.sendFile(__dirname + '/../node_modules/mithril/mithril.min.js')
    })
    app.get('/progressbar.js', function (req, res) {
        res.sendFile(__dirname + '/../lib_dev/progressbar.js')
    })
    app.get('/mithical.js', function (req, res) {
        res.sendFile(__dirname + '/client/script.js')
    })
}