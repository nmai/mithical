/* 
 * The only thing that comes to a sleeping man is dreams.
 *
 */

'use strict'

let m = require('../lib/mithril')
let List = require('./component/list')

// @todo: the ability to save.
// add a recent todolist browser component
// add a "new" and "delete" button
// localstorage or database.
// loads and displays most recent list by default.
// most of this shit will be managed OUTSIDE of the List class. List will just provide JSON representations.

m.mount(document.getElementById('container'), {controller: List.controller, view: List.view})

// @todo: persistent cursor position (when shifting up and down)
// medium priority. turns out this is slightly more complex than I originally thought.

// @todo: more polishing. lower priority.
// replace current tiny checkboxes with something nicer
// perhaps move checkboxes to outside the list, but let them collapse into the list if necessary
// add the animated caret thingy
// add the ability to check items off with a keystroke

// thought: perhaps I really do need to switch to a hidden textarea.
// I just realized selection and copy/paste is impossible with my current implementation.
