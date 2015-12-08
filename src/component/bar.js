/* ( $ _ $ )
 *
 * Holla holla holla
 *
 */

'use strict'

let m = require('../../lib/mithril')
let ProgressBar = require('progressbar.js')

let options = {
  strokeWidth: 12.0,
  trailColor: '#eee',
  easing: 'easeInOut',
  duration: 500,
  from: { color: '#AC3232' },
  to: { color: '#99E450' },
  step: function(state, shape) {
    shape.path.setAttribute('stroke', state.color)
  }
}

let Bar = {
  controller: function () {
    console.log('controller called')
    Bar.update = function (val){
      if(Bar.progressbar) {
        if (val >= 0.0 && val <= 1.0) {
          this.progressbar.animate(val)
        } else {
          throw new Error('Value not valid: ' + val)
        }
      } else {
        throw new Error('ProgressBar child instance not defined')
      }
    }
  },
  view: function (ctrl) {
    return m('div', {
      style: {
        maxWidth: '400px', 
        marginBottom: '12px'
      },
      config: function (el, isInit, context) {
        context.retain = true
        if (!isInit) {
          console.log('initializing')
          Bar.progressbar = new ProgressBar.Line(el, options)
          Bar.progressbar.set(0)
        }
      }
    })
  }
}

module.exports = Bar
