'use strict'

let m = require('../../lib/mithril')
let Bar = require('./bar.js')
let Task = require('./task.js')
let Cell = require('./cell.js')

//the List component is structured as a singleton (sort of)
//I am in the process of stripping this down. This should only keep track of a list
//of Cell component instances, plus a counter used for updating the progress bar.
let List = {
  vm: (function() {
    var vm = {}
    vm.init = function() {
      //a running list of todos
      vm.list = new Array()

      //a slot to store the name of a new todo before it is created
      vm.description = m.prop('')
      vm.selected

      vm.recalculate = () => {
        // @TODO: optimize further and (maybe) break this out to a separate helper function
        //        Or perhaps dispatch a custom event.
        // Update the progress bar.
        console.log('recalculating')
        let complete = 0
        let total = 0
        vm.list.map( (t) => {
          if (t.done()) {
            ++complete
          }
          if (t.valid()) {
            ++total
          }
        })
        console.log(Bar)
        if (total > 0) {
          Bar.update(complete / total)
        } else if (complete === total) {
          Bar.update(0)
        } else {
          throw new Error()
        }
      }

      //adds a todo to the list, and clears the description field for user convenience
      vm.add = (autoselect) => {
        //if (vm.description()) {
        let t = new Task({description: vm.description(), vm: List.vm})
        vm.list.push(t)
        vm.description('')
        if (autoselect) {
          // Unnecessary right now. May need this later.
          vm.selected = t


          t.needFocus(true)
        }
        return t
        //}
      }

      //add a single item to get started. set as the currently selected element.
      vm.add(true)

      vm.checkOff = function(task) {
        task.done(!task.done())
        vm.recalculate()
        console.log('checkoff')
      }
    }
    return vm
  }()),
  controller: function (){
    List.vm.init()
  },
  view: function (){
    return [
      m.component(Bar),
      //m('input', {onchange: m.withAttr('value', List.vm.description), value: List.vm.description()}),
      //m('button', {onclick: List.vm.add}, 'Add'),
      m('table',
        List.vm.list.map(function(task, index) {
          return m.component(Cell, {task: task, key: task})
        })
      )
    ]
  }
}

module.exports = List