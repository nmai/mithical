/*THIS IS OUTPUT FROM THE BABEL TRANSPILER. Edit the ES6 source in /src instead.*/'use strict';

/*THIS IS OUTPUT FROM THE BABEL TRANSPILER. Edit the ES6 source in /src instead.*/'use strict';

exports.parentDir = function (dirname) {
    // Parent dir will be an empty string unless '/' can be found
    var pDir = '';
    if (dirname) {
        var i = dirname.lastIndexOf('/');
        if (i < 0) {
            console.log('1');
            return pDir;
        }
        pDir = dirname;
        if (i >= dirname.length - 1) {
            if (dirname.length === 1) {
                return '/';
            } else {
                pDir = pDir.substring(0, i);
            }
        }
        pDir = pDir.substring(0, i);
        i = dirname.lastIndexOf('/');
        if (i < 0) {
            // You suck.
            return '';
        } else {
            // Ah yes, finally.
            return pDir.substring(0, i);
        }
    } else {
        return pDir;
    }
};