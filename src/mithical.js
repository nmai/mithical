'use strict'

/* SHELVED. Might need to fork progressbar.js for a clean solution.
// a Mithril component wrapping the progressbar.js
let ProgressBar = {
    controller: function(args) {

    }
    view: function(ctrl) {
        return m()
    }
} */

// Plan: Capture focus with a hidden textarea.
// As input events are fired, construct task items in the view model
// Data in the view model is bound to the DOM, similar to how the original todo app worked.

// Container for the page. Could be kept within List but having this separate
// grants me greater flexibility down the road.
// let Container = {
//     view: function() {
//         m('div', {id: 'container', style: {maxWidth: '400px', margin: 'auto'}})
//     }
// }

var opts = {
  strokeWidth: 12.0,
  trailColor: '#eee',
  easing: 'easeInOut',
  duration: 500,
  from: { color: '#AC3232' },
  to: { color: '#99E450' },
  step: function(state, shape, attachment) {
    shape.path.setAttribute('stroke', state.color)
  }
}
let progressBar

//the Task class just keeps track of data
let Task = function(data) {
  this.description = m.prop(data.description)
  this.done = m.prop(false)
  this.valid = m.prop(false)
}


//initialize the application
//m.mount(document, Container)
m.mount(document.getElementById('container'), {controller: List.controller, view: List.view})
