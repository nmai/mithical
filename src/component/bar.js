'use strict'

let options = {
  strokeWidth: 12.0,
  trailColor: '#eee',
  easing: 'easeInOut',
  duration: 500,
  from: { color: '#AC3232' },
  to: { color: '#99E450' },
  step: function(state, shape, attachment) {
    shape.path.setAttribute('stroke', state.color)
  }
}

let Bar = {
  controller: function (args) {
    this.progressBar

    this.setProgressBar = (pbar) => {
      this.progressBar = pbar
    }

    this.animate = (val) => {
      this.progressBar.animate(val)
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
          ctrl.setProgressBar(new ProgressBar.Line(el, options))
          ctrl.progressBar.set(0)
        }
      }
    })
  }
}