// This will point to the progress bar element instance
var progressBar;

//this application only has one component: todo
var todo = {};

//for simplicity, we use this component to namespace the model classes

//the Todo class has two properties
todo.Todo = function(data) {
    this.description = m.prop(data.description);
    this.done = m.prop(false);
};

//the TodoList class is a list of Todo's
todo.TodoList = Array;

//the view-model tracks a running list of todos,
//stores a description for new todos before they are created
//and takes care of the logic surrounding when adding is permitted
//and clearing the input after adding a todo to the list
todo.vm = (function() {
    var vm = {}
    vm.init = function() {
        //a running list of todos
        vm.list = new todo.TodoList();

        //a slot to store the name of a new todo before it is created
        vm.description = m.prop('');

        //adds a todo to the list, and clears the description field for user convenience
        vm.add = function() {
            if (vm.description()) {
                vm.list.push(new todo.Todo({description: vm.description()}));
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
}())

//the controller defines what part of the model is relevant for the current page
//in our case, there's only one view-model that handles everything
todo.controller = function() {
    todo.vm.init()
}

//here's the view
todo.view = function() {
    return m('html', [
        m('body', [
        	m('div', {id: 'container', style: {maxWidth: '400px', margin: 'auto'}}, [
                m('div', {id: 'progress-visual', style: {maxWidth: '400px', marginBottom: '12px'} }),
                m('input', {onchange: m.withAttr('value', todo.vm.description), value: todo.vm.description()}),
                m('button', {onclick: todo.vm.add}, 'Add'),
                m('table', [
                    todo.vm.list.map(function(task, index) {
                        return m('tr', [
                            m('td', [
                                m('input[type=checkbox]', todo.vm.checkOff(task))
                            ]),
                            m('td', {style: {textDecoration: task.done() ? 'line-through' : 'none'}}, task.description()),
                        ])
                    })
                ]),
                m('textarea', {id: 'texty', style: {width: '100%', maxWidth: 'inherit', border: 'none'}}) 
            ])
        ])
    ]);
};

//initialize the application
m.mount(document, {controller: todo.controller, view: todo.view});

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
