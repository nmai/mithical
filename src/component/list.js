'use strict'

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

      //adds a todo to the list, and clears the description field for user convenience
      vm.add = function(autoselect) {
        //if (vm.description()) {
        let t = new Task({description: vm.description()})
        vm.list.push(t)
        vm.description('')
        if (autoselect) {
          vm.selected = t
        }
        return t
        //}
      }

      //add a single item to get started. set as the currently selected element.
      vm.add(true)

      vm.checkOff = function(task) {
        task.done(!task.done())
        // @TODO: optimize further and (maybe) break this out to a separate helper function
        //        Or perhaps dispatch a custom event.
        // Update the progress bar.
        var complete = 0
        vm.list.map( (t) => {
          if (t.done()) {
            ++complete
          }
        })
        console.log(Bar.controller.progressBar)
        if (Bar.controller.progressBar) {
          var le = vm.list.length
          if (le > 0) {
            Bar.controller.animate(complete / le)
          } else if (complete === le) {
            Bar.controller.animate(0)
          } else {
            Bar.controller.progressBar.set(0)
            throw new Error("Huh, looks like your list broke")
          }
        }
      }
    }
    return vm
  }()),
  controller: function (args){
    List.vm.init()
  },
  view: function (ctrl){
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