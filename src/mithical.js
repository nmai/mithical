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

    app.get('/', function (req, res) {
        res.send(ejs.render(template_main, {filename: 'test'} ))
    })

    // Lame
    app.get('/mithril.js', function (req, res) {
        res.sendFile(__root + '/node_modules/mithril/mithril.js')
    })
    app.get('/progressbar.js', function (req, res) {
        res.sendFile(__root + '/lib_dev/progressbar.js')
    })
    app.get('/mithical.js', function (req, res) {
        res.sendFile(__root + '/src/client/script.js')
    })
}

// @todo: for cleanup. unnecessary now.
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