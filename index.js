'use strict'

console.log(process.version)
global.reqlib = require('app-root-path').require;
var semver = require('semver')
var express = require('express')
var app = express()

// Perhaps there is a better way to confirm ES6 support.
/*if (process.version && semver.gt(process.version, '4.0.0')) {
  module.exports = reqlib('./src/server.js')(app)
} else {
  module.exports = reqlib('./build/server.js')(app)
}*/

var ejs = require('ejs')
var fs = require('fs')
var __root = require('app-root-path').resolve('');

ejs.delimiter = '%'

var template_main = fs.readFileSync('src/template/main.ejs', {encoding: 'UTF-8'})

app.get('/', function (req, res) {
  res.send(ejs.render(template_main, {filename: 'index'} ))
})

app.use(express.static(__root + '/lib'));
app.use(express.static(__root + '/src'));

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

app.listen(8080)