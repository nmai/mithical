console.log(process.version)

var semver = require('semver')

// Perhaps there is a better way to confirm ES6 support.
if (process.version && semver.gt(process.version, '4.0.0')) {
  module.exports = require('./src/mithical.js')
} else {
  module.exports = require('./build/mithical.js')
}