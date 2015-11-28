'use strict'

// Cell 2.0: serves strictly as a template to structure data stored elsewhere
let Cell = {
    controller: function (args) {
        return {task: args.task}
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
                        },
                        contentEditable: true,
                        onkeypress: (e) => {
                            // Catch return keystrokes
                            if (e.keyCode == '13') {
                                e.preventDefault()
                                List.vm.add(true)
                            }
                        },
                        innerText: ctrl.task.description(),
                        oninput: (e) => {
                            ctrl.task.description(e.target.innerText)
                            if (ctrl.task.description().length > 0) {
                                ctrl.task.valid(true)
                            } else {
                                ctrl.task.valid(false)
                            }
                            console.log(ctrl.task.description())
                        },
                        config: (el) => {
                            // *sigh* this is so bad
                            // @todo: figure out how to move this function declaration out while keeping el in scope.
                            //   Either that or figure out how to get innerText directly.
                            //if(!this.updateDescription) {
                                this.updateDescription = function () {
                                    ctrl.task.description(el.innerText)
                                }
                            //}
                            // Check in with the view model to see if it's OK to grab the focus
                            if (List.vm.selected === ctrl.task) {
                                el.focus()
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
                        onclick: (e) => {List.vm.checkOff(ctrl.task)},
                        checked: ctrl.task.done()
                    })
                ])
            ])
        )
    }
}