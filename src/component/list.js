'use strict'

let m = require('../../lib/mithril')
let Bar = require('./bar.js')
let Task = require('./task.js')
let Cell = require('./cell.js')

// the List component is structured as a singleton (sort of)
// I am in the process of stripping this down. This should only keep track of a list
// of Cell component instances, plus a counter used for updating the progress bar.
let List = {}

List.vm = (function() {
  var vm = {}
  vm.init = function() {
    //a running list of todos
    vm.list = new Array()

    // a slot to store the name of a new todo before it is created
    vm.description = m.prop('')

    // index of currently selected item
    let _selected = 0
    vm.selectTask = (t) => {
      if (t) {
        let memberIndex = -1
        for (let i = 0; i < vm.list.length; i++) {
          let item = vm.list[i]
          if (item === t) {
            memberIndex = i
            break
          }
        }
        if (memberIndex >= 0) {
          _selected = memberIndex
          t.needFocus(true)
        } else {
          throw new Error('Could not find referenced task in list')
        }
      } else {
        throw new Error('Cannot select undefined task')
      }
    }
    vm.selectIndex = (i) => {
      let t = vm.list[i]
      if (t) {
        vm.selectTask(t)
        return true
      } else {
        // If no such item exists, don't throw an error. This is by design.
        // @todo: check i < 0 and i > length instead
        return false
      }
    }
    vm.shiftUp = (cursorPlacement) => {
      vm.selectIndex(_selected - 1)
    }
    vm.shiftDown = (cursorPlacement) => {
      vm.selectIndex(_selected + 1)
    }

    vm.recalculate = () => {
      // @TODO: optimize further and (maybe) break this out to a separate helper function
      //        Or perhaps dispatch a custom event.
      // Update the progress bar.
      console.log('Recalculating progress...')
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
        vm.selectTask(t)
      }
      return t
      //}
    }

    //add a single item to get started. set as the currently selected element.
    vm.add(true)

    vm.checkOff = function(task) {
      task.done(!task.done())
      vm.recalculate()
    }
  }
  return vm
}())

List.controller = function (){
  List.vm.init()
}

List.view = function (){
  return [
    m.component(Bar),
    m('table',
      List.vm.list.map(function(task) {
        return m.component(Cell, {task: task, key: task})
      })
    )
  ]
}

module.exports = List