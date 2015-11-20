'use strict'

let ejs = require('ejs')
let __parent = parentDir(__dirname)
let app
ejs.delimiter = '%'

// These strings will be replaced with `include('file.ejs')` later
let head        = ''
let part_header = ''
let part_footer = ''
let part_body   = ''

module.exports = function (express_app) {
    app = express_app

    app.get('/', function (req, res) {
    res.send(ejs.render(template_body, 
        {head: head, header: part_header, body: part_body, footer: part_footer, filename: 'test'}))
    })

    // Lame
    app.get('/mithril.min.js', function (req, res) {
        res.sendFile(__parent + '/node_modules/mithril/mithril.min.js')
    })
    app.get('/progressbar.js', function (req, res) {
        res.sendFile(__parent + '/lib_dev/progressbar.js')
    })
    app.get('/mithical.js', function (req, res) {
        res.sendFile(__parent + '/src/client/script.js')
    })
}

// I don't know why the hell this is necessary but I have no internet right now.
// Simply using `__dirName + '/../asdf'` fails. Console output says FORBIDDEN
function parentDir (dirname) {
    // Parent dir will be an empty string unless '/' can be found
    let pDir = ''
    if (dirname) {
        let i = dirname.lastIndexOf('/')
        if (i < 0) {
            console.log('1')
            return pDir
        }
        pDir = dirname
        if (i >= dirname.length - 1) {
            if (dirname.length === 1) {
                return '/'
            } else {
                pDir = pDir.substring(0, i)
            }
        } 
        pDir = pDir.substring(0, i)
        i = dirname.lastIndexOf('/')
        if (i < 0) {
            // You suck.
            return ''
        } else {
            // Ah yes, finally.
            return pDir.substring(0, i)
        }
    } else {
        return pDir
    }
}