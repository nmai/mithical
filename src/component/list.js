/* ( ⚆ _ ⚆ )
 *
 * Come early tomorrow, for we shall do beautiful things in the morning.
 *
 */

'use strict'

let localforage = require('localforage')
let m = require('../../lib/mithril')
let Bar = require('./bar.js')
let Task = require('./task.js')
let Cell = require('./cell.js')

// the List component is structured as a singleton (sort of)
// I am in the process of stripping this down. This should only keep track of a list
// of Cell component instances, plus a counter used for updating the progress bar.
let List = {}

// @todo: pls clean up
global.localforage = localforage
global.List = List

List.vm = (function() {
  var vm = {}
  vm.init = function() {

    // gah disgusting please get rid of this asap
    document.body.addEventListener('click', () => {
      vm.selectIndex(vm.list.length - 1)
      m.redraw()
    })

    
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

    vm.selectIndex = (i, cursorPlacement) => {
      let t = vm.list[i]
      if (t) {
        vm.selectTask(t, cursorPlacement)
        return true
      } else {
        // If no such item exists, don't throw an error. This is by design.
        // @todo: check i < 0 and i > length instead
        return false
      }
    }
    vm.shiftUp = (cursorPlacement) => {
      vm.selectIndex(_selected - 1, cursorPlacement)
    }
    vm.shiftDown = (cursorPlacement) => {
      vm.selectIndex(_selected + 1, cursorPlacement)
    }

    //adds a todo to the list, and clears the description field for user convenience
    vm.add = (autoselect) => {
      let t = new Task({description: vm.description(), vm: List.vm})
      vm.list.push(t)
      vm.description('')

      if (autoselect) {
        vm.selectTask(t)
      }

      vm.save()

      return t
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

    //a running list of todos
    vm.list = new Array()

    localforage.getItem('document').then(function(value) {
      console.log(value)
      if (value) {
        // @todo: change this to .add(), for autoselect support.
        vm.list = value.map((desc) => {
          let data = JSON.parse(desc)
          return new Task({
            description: data.description,
            done: data.done,
            vm: vm
          })
        })
        if (vm.list.length === 1) {
          vm.selectIndex(0)
        }
        vm.recalculate()
      } else {
        vm.list = []
        // localforage.setItem('document', vm.list)
      }
    }).then(function() {
      console.log(vm.list)
      // a slot to store the name of a new todo before it is created
      vm.description = m.prop('')

      vm.save = function() {
        let flat = vm.list.map((task) => {
          return JSON.stringify(task)
        })
        localforage.setItem('document', flat)
      }

      // deletes a task from the list and selects the previous task
      vm.remove = (task) => {
        let i = vm.list.indexOf(task)

        if (vm.list.length > 0) {
          if (i > 0) {
            vm.selectIndex(i - 1)
          } else {
            // @todo: perhaps find a cleaner solution
            // Right now we rely on the fact that selectIndex will handle
            // out of bound indices.
            vm.selectIndex(i + 1)
          }

          // @todo: ensure that task is actually a member of the list
          vm.list.pop(task)

          vm.save()

          return true
        }

        // we didn't actually remove anything, because there was only 1 item.
        return false
      }

      //add a single item to get started. set as the currently selected element.
      if(vm.list.length < 1) {
        vm.add(true)
      }

      vm.checkOff = function(task) {
        console.log('CHECKING OFF')
        task.done(!task.done())
        vm.recalculate()
        vm.save()
      }

      // everything above was async so we need to refresh
      m.redraw()
    })
  }
  return vm
}())

List.controller = function (){
  List.vm.init()
}

List.view = function (){
  return [
    //m('button', { onclick: List.vm.save, style: {marginBottom: '10px'}}),
    m('br'),
    m.component(Bar),
    m('table',
      List.vm.list.map(function(task) {
        return m.component(Cell, {task: task, key: task})
      })
    )
  ]
}

module.exports = List