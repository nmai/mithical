'use strict'

console.log(process.version)
global.reqlib = require('app-root-path').require
var express = require('express')
var app = express()
var ejs = require('ejs')
var fs = require('fs')
var __root = require('app-root-path').resolve('')

ejs.delimiter = '%'

var template_main = fs.readFileSync('src/template/main.ejs', {encoding: 'UTF-8'})

app.get('/', function (req, res) {
  res.send(ejs.render(template_main, {filename: 'index'} ))
})

app.use(express.static(__root + '/lib'))
app.use(express.static(__root + '/src'))

var http = app.listen(8080)

// For auto-reload on server restart. Development feature only.
var io = require('socket.io').listen(http)

process.on('exit', function  () {
  console.log('Closing all socket connections')
  io.close()
})

// @todo: figure out a better way to confirm ES6 support.
/*
var semver = require('semver')

if (process.version && semver.gt(process.version, '4.0.0')) {
  module.exports = reqlib('./src/server.js')(app)
} else {
  module.exports = reqlib('./build/server.js')(app)
}
*/

// @todo: launch dev tools (i.e. page auto-reload) only when a flag is set
/*
var args = process.argv.slice(2)

for (var a in args) {
  switch (a) {
    case 'dev':
      console.log('[Info] Running in development mode')
      break
    default:
      throw new Error('"'+a+'"'+' is not recognized as a valid argument')
      break
  }
}
*/