/* ( ◎ _ ◎ )
 *
 * Once more, it is I who will guide you.
 *
 */

'use strict'

let m = require('../../lib/mithril')

// Not really a component. A Task just keeps track of data
// @todo: consider combining Task and Cell into one.
// I see no reason to keep them apart, especially given how much
// they depend on each other.
let Task = function(data) {
  this.description = m.prop(data.description)
  this.done = m.prop(false)
  this.valid = m.prop(false)
  this.needFocus = m.prop(false)
  this.vm = data.vm ? data.vm : null
}

module.exports = Task