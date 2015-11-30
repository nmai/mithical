'use strict'

let m = require('../../lib/mithril')

//Not really a component. A Task just keeps track of data
let Task = function(data) {
  this.description = m.prop(data.description)
  this.done = m.prop(false)
  this.valid = m.prop(false)
  this.needFocus = m.prop(false)
  this.vm = data.vm ? data.vm : null
}

module.exports = Task