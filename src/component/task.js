'use strict'

//Not really a component. A Task just keeps track of data
let Task = function(data) {
  this.description = m.prop(data.description)
  this.done = m.prop(false)
  this.valid = m.prop(false)
}

module.exports = Task