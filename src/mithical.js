/* 
 * The only thing that comes to a sleeping man is dreams.
 *
 */

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
let m = require('../lib/mithril')
let List = require('./component/list')

//initialize the application
//m.mount(document, Container)
m.mount(document.getElementById('container'), {controller: List.controller, view: List.view})

// @todo: persistent cursor position (when shifting up and down)
// high priority because very simple and would help UX a lot

// @todo: the ability to save.
// add a recent todolist browser component
// add a "new" and "delete" button
// localstorage or database.
// loads and displays most recent list by default.
// most of this shit will be managed OUTSIDE of the List class. List will just provide JSON representations.

// @todo: more polishing. lower priority.
// replace current tiny checkboxes with something nicer
// perhaps move checkboxes to outside the list, but let them collapse into the list if necessary
// add the animated caret thingy
// add the ability to check items off with a keystroke

// thought: perhaps I really do need to switch to a hidden textarea.
// I just realized selection and copy/paste is impossible with my current implementation.
