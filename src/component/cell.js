'use strict'

let m = require('../../lib/mithril')
let List = require('./list')

// Cell 2.0: serves strictly as a template to structure data stored elsewhere
let Cell = {
  controller: function (args) {
    // Yeah, there has to be a better way.
    // This is messy but still cleaner than what I was doing before.
    this.requestFocus = function () {
      args.task.needFocus(true)
    }

    return {
      task: args.task
    }
  },
  view: function (ctrl) {
    console.log(ctrl)
    return (
      m('tr', [
        m('td', {style: {width: '100%'}}, [
          m('div', {
            style: {
              textDecoration: ctrl.task.done() ? 'line-through' : 'none',
              outline: 0,
              width: '100%',
              fontFamily: 'Helvetica Neue',
              fontWeight: '300',
              fontSize: '20px',
              whiteSpace: 'pre'
            },
            contentEditable: true,
            onkeypress: (e) => {
              // Catch return keystrokes
              if (e.keyCode == '13') {
                e.preventDefault()
                ctrl.task.vm.add(true)
              }
            },
            innerText: ctrl.task.description(),
            oninput: (e) => {
              ctrl.task.description(e.target.innerText)
              if (ctrl.task.description().length > 0) {
                if (!ctrl.task.valid()) {
                  ctrl.task.valid(true)
                  ctrl.task.vm.recalculate()
                }
              } else {
                console.log('hit 0')
                ctrl.task.valid(false)
                ctrl.task.done(false)
                ctrl.task.vm.recalculate()
              }
              console.log(ctrl.task.description())
            },
            config: (el) => {
              // If a request was queued, grab the focus and reset.
              if (ctrl.task.needFocus()) {
                el.focus()
                ctrl.task.needFocus(false)
              }
            }
          })
        ]),
        m('td', [
          m('input[type=checkbox]', {
            style: {
              visibility: ctrl.task.valid() ? 'visible' : 'hidden'
            },
            //Here we need to add onclick listener to toggle states
            onclick: (e) => {ctrl.task.vm.checkOff(ctrl.task)},
            checked: ctrl.task.done()
          })
        ])
      ])
    )
  }
}

module.exports = Cell
