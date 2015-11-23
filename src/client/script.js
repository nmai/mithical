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
// As input events are fired, construct todo items in the view model
// Data in the view model is bound to the DOM, similar to how the original todo app worked.

// Container for the page. Could be kept within TodoList but having this separate
// grants me greater flexibility down the road.
// let Container = {
//     view: function() {
//         m('div', {id: 'container', style: {maxWidth: '400px', margin: 'auto'}})
//     }
// }

//the Todo class has two properties
let Todo = function(data) {
    this.description = m.prop(data.description);
    this.done = m.prop(false);
}

let TodoList = {
    vm: (function() {
        var vm = {}
        vm.init = function() {
            //a running list of todos
            vm.list = new Array();

            //a slot to store the name of a new todo before it is created
            vm.description = m.prop('');

            //adds a todo to the list, and clears the description field for user convenience
            vm.add = function() {
                if (vm.description()) {
                    vm.list.push(new Todo({description: vm.description()}));
                    vm.description('');
                }
            };

            vm.checkOff = function(task) {
                console.log(task.description())
                // @TODO: optimize further and (maybe) break this out to a separate helper function
                //        Or perhaps dispatch a custom event.
                // Update the progress bar.
                var complete = 0
                vm.list.map( (t) => {
                    console.log(t)
                    if (t.done()) {
                        ++complete
                    }
                })

                // don't see how it could possibly be zero and trigger a check event,
                // but it never hurts to play it safe
                var le = vm.list.length
                if (le > 0) {
                    progressBar.animate(complete / le)
                } else if (complete === le) {
                    progressBar.animate(0)
                } else {
                    progressBar.set(0)
                    throw new Error("Huh, looks like your list broke")
                }

                return {onclick: m.withAttr('checked', task.done), checked: task.done()}
            }
        }
        return vm
    }()),
    controller: function (args){
        TodoList.vm.init()
    },
    view: function (ctrl){
        m('div', {id: 'progress-visual', style: {maxWidth: '400px', marginBottom: '12px'} }),
        m('input', {onchange: m.withAttr('value', this.vm.description), value: this.vm.description()}),
        m('button', {onclick: this.vm.add}, 'Add'),
        m('table', [
            this.vm.list.map(function(task, index) {
                return m('tr', [
                    m('td', [
                        m('input[type=checkbox]', vm.checkOff(task))
                    ]),
                    m('td', {style: {textDecoration: task.done() ? 'line-through' : 'none'}}, task.description()),
                ])
            })
        ])
    }
}

/*
        vm.checkOff = function(task) {
            console.log(task.description())
            // @TODO: optimize further and (maybe) break this out to a separate helper function
            //        Or perhaps dispatch a custom event.
            // Update the progress bar.
            var complete = 0
            vm.list.map( (t) => {
                console.log(t)
                if (t.done()) {
                    ++complete
                }
            })

            // don't see how it could possibly be zero and trigger a check event,
            // but it never hurts to play it safe
            var le = vm.list.length
            if (le > 0) {
                progressBar.animate(complete / le)
            } else if (complete === le) {
                progressBar.animate(0)
            } else {
                progressBar.set(0)
                throw new Error("Huh, looks like your list broke")
            }

            return {onclick: m.withAttr('checked', task.done), checked: task.done()} */


//initialize the application
//m.mount(document, Container)
m.mount(document, TodoList);

var opts = {
    strokeWidth: 12.0,
    trailColor: '#eee',
    easing: 'easeInOut',
    duration: 500,
    from: { color: '#AC3232' },
    to: { color: '#99E450' },
    step: function(state, shape, attachment) {
        shape.path.setAttribute('stroke', state.color);
    }
}
progressBar = new ProgressBar.Line('#progress-visual', opts);
progressBar.set(0)
