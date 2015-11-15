console.log(process.version)

var semver = require('semver')
var express = require('express')
var app = express()

// Perhaps there is a better way to confirm ES6 support.
if (process.version && semver.gt(process.version, '4.0.0')) {
  module.exports = require('./src/mithical.js')(app)
} else {
  module.exports = require('./build/mithical.js')
}

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