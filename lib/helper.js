`use strict`

exports.parentDir = function (dirname) {
  // Parent dir will be an empty string unless '/' can be found
  let pDir = ''
  if (dirname) {
    let i = dirname.lastIndexOf('/')
    if (i < 0) {
      console.log('1')
      return pDir
    }
    pDir = dirname
    if (i >= dirname.length - 1) {
      if (dirname.length === 1) {
        return '/'
      } else {
        pDir = pDir.substring(0, i)
      }
    } 
    pDir = pDir.substring(0, i)
    i = dirname.lastIndexOf('/')
    if (i < 0) {
      // You suck.
      return ''
    } else {
      // Ah yes, finally.
      return pDir.substring(0, i)
    }
  } else {
    return pDir
  }
}

// damn, I thought I finally had a use case for generators but nah
// I'll leave this in for now.
function* Keygen(){
  var index = 0
  yield index++
}
let kgen = Keygen()