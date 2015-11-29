'use strict';

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

// Container for the page. Could be kept within TodoList but having this separate
// grants me greater flexibility down the road.
// let Container = {
//     view: function() {
//         m('div', {id: 'container', style: {maxWidth: '400px', margin: 'auto'}})
//     }
// }

// damn, I thought I finally had a use case for generators but nah
// I'll leave this in for now.

/*THIS IS OUTPUT FROM THE BABEL TRANSPILER. Edit the ES6 source in /src instead.*/
var _marked = [Keygen].map(regeneratorRuntime.mark);

function Keygen() /*THIS IS OUTPUT FROM THE BABEL TRANSPILER. Edit the ES6 source in /src instead.*/{
    var index;
    return regeneratorRuntime.wrap(function Keygen$(_context) {
        while (1) switch (_context.prev = _context.next) {
            case 0:
                index = 0;
                _context.next = 3;
                return index++;

            case 3:
            case 'end':
                return _context.stop();
        }
    }, _marked[0], this);
}
var kgen = Keygen();

var opts = {
    strokeWidth: 12.0,
    trailColor: '#eee',
    easing: 'easeInOut',
    duration: 500,
    from: { color: '#AC3232' },
    to: { color: '#99E450' },
    step: function /*THIS IS OUTPUT FROM THE BABEL TRANSPILER. Edit the ES6 source in /src instead.*/step(state, shape, attachment) {
        shape.path.setAttribute('stroke', state.color);
    }
};
var progressBar = /*THIS IS OUTPUT FROM THE BABEL TRANSPILER. Edit the ES6 source in /src instead.*/undefined;

//the Task class just keeps track of data
var Task = function Task(data) {
    this.description = m.prop(data.description);
    this.done = m.prop(false);
    this.valid = m.prop(false);
};

// Cell 2.0: serves strictly as a template to structure data stored elsewhere
var Cell = {
    controller: function /*THIS IS OUTPUT FROM THE BABEL TRANSPILER. Edit the ES6 source in /src instead.*/controller(args) {
        return { task: args.task };
    },
    view: function /*THIS IS OUTPUT FROM THE BABEL TRANSPILER. Edit the ES6 source in /src instead.*/view(ctrl) {
        /*THIS IS OUTPUT FROM THE BABEL TRANSPILER. Edit the ES6 source in /src instead.*/
        var _this = this;

        console.log(ctrl);
        return m('tr', [m('td', { style: { width: '100%' } }, [m('div', {
            style: {
                textDecoration: ctrl.task.done() ? 'line-through' : 'none',
                outline: 0,
                width: '100%',
                fontFamily: 'Helvetica Neue',
                fontWeight: '300',
                fontSize: '20px'
            },
            contentEditable: true,
            onkeypress: function /*THIS IS OUTPUT FROM THE BABEL TRANSPILER. Edit the ES6 source in /src instead.*/onkeypress(e) {
                // Catch return keystrokes
                if (e.keyCode == '13') {
                    e.preventDefault();
                    TodoList.vm.add(true);
                }
            },
            innerText: ctrl.task.description(),
            oninput: function /*THIS IS OUTPUT FROM THE BABEL TRANSPILER. Edit the ES6 source in /src instead.*/oninput(e) {
                ctrl.task.description(e.target.innerText);
                if (ctrl.task.description().length > 0) {
                    ctrl.task.valid(true);
                } else {
                    ctrl.task.valid(false);
                }
                console.log(ctrl.task.description());
            },
            config: function /*THIS IS OUTPUT FROM THE BABEL TRANSPILER. Edit the ES6 source in /src instead.*/config(el) {
                // *sigh* this is so bad
                // @todo: figure out how to move this function declaration out while keeping el in scope.
                //   Either that or figure out how to get innerText directly.
                //if(!this.updateDescription) {
                /*THIS IS OUTPUT FROM THE BABEL TRANSPILER. Edit the ES6 source in /src instead.*/_this.updateDescription = function () {
                    ctrl.task.description(el.innerText);
                };
                //}
                // Check in with the view model to see if it's OK to grab the focus
                if (TodoList.vm.selected === ctrl.task) {
                    el.focus();
                }
            }
        })]), m('td', [m('input[type=checkbox]', {
            style: {
                visibility: ctrl.task.valid() ? 'visible' : 'hidden'
            },
            //Here we need to add onclick listener to toggle states
            onclick: function /*THIS IS OUTPUT FROM THE BABEL TRANSPILER. Edit the ES6 source in /src instead.*/onclick(e) {
                TodoList.vm.checkOff(ctrl.task);
            },
            checked: ctrl.task.done()
        })])]);
    }
};

//the Cell component creates an internal Task instance
//renders to contenteditable div. button on the side.
// let Cell = function () {
//     this.controller = (args) => {

//     }
//     this.view = (ctrl) => {
//         return [

//         ]
//     }
// }

//the TodoList component is structured as a singleton (sort of)
//I am in the process of stripping this down. This should only keep track of a list
//of Cell component instances, plus a counter used for updating the progress bar.
var TodoList = {
    vm: (function () {
        var vm = {};
        vm.init = function () {
            //a running list of todos
            vm.list = new Array();

            //a slot to store the name of a new todo before it is created
            vm.description = m.prop('');
            vm.selected;

            //adds a todo to the list, and clears the description field for user convenience
            vm.add = function (autoselect) {
                //if (vm.description()) {
                var t = new Task({ description: vm.description() });
                vm.list.push(t);
                vm.description('');
                if (autoselect) {
                    vm.selected = t;
                }
                return t;
                //}
            };

            //add a single item to get started. set as the currently selected element.
            vm.add(true);

            vm.checkOff = function (task) {
                task.done(!task.done());
                // @TODO: optimize further and (maybe) break this out to a separate helper function
                //        Or perhaps dispatch a custom event.
                // Update the progress bar.
                var complete = 0;
                vm.list.map(function (t) {
                    if (t.done()) {
                        ++complete;
                    }
                });

                // don't see how it could possibly be zero and trigger a check event,
                // but it never hurts to play it safe
                // @TODO: Currently this executes only when progressbar is on DOM
                // Later I need to find a better solution. Like making a component.
                if (progressBar) {
                    var le = vm.list.length;
                    if (le > 0) {
                        progressBar.animate(complete / le);
                    } else if (complete === le) {
                        progressBar.animate(0);
                    } else {
                        progressBar.set(0);
                        throw new Error("Huh, looks like your list broke");
                    }
                }
            };
        };
        return vm;
    })(),
    controller: function /*THIS IS OUTPUT FROM THE BABEL TRANSPILER. Edit the ES6 source in /src instead.*/controller(args) {
        TodoList.vm.init();
    },
    view: function /*THIS IS OUTPUT FROM THE BABEL TRANSPILER. Edit the ES6 source in /src instead.*/view(ctrl) {
        return [m('div', { id: 'progress-visual', style: { maxWidth: '400px', marginBottom: '12px' } }),
        //m('input', {onchange: m.withAttr('value', TodoList.vm.description), value: TodoList.vm.description()}),
        //m('button', {onclick: TodoList.vm.add}, 'Add'),
        m('table', TodoList.vm.list.map(function (task, index) {
            return m.component(Cell, { task: task, key: task });
        }))];
    }
};

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
m.mount(document.getElementById('container'), { controller: TodoList.controller, view: TodoList.view });

progressBar = new ProgressBar.Line('#progress-visual', opts);
progressBar.set(0);

/* notes: getting focus

function isFocused() {
  if (document.activeElement.id == "journal-content") {
    alert("Focused!");
  } else {
    alert("Not focused :(");
  }
}

#journal-content {
  background-color: #eee;
}
#not-journal-content {
  background-color: #ccc;
}

<div id="journal-content" contenteditable="true" onclick="isFocused()">Journal Content</div>
<div id="not-journal-content" contenteditable="true" onclick="isFocused()">Not Journal Content</div>

*/