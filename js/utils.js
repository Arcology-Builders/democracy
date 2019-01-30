// Utilities
fs = require('fs')
path = require('path')

/**
 * Traverse directories collecting files to perform a callback function on
 * @param startDirs a list of paths to start searching in
 * @param skipFilt a function that returns true for files that need to be skipped
 * @param cb a callback that accepts the source text of a file plus its full path
 */
function traverseDirs(startDirs, skipFilt, cb) {
  queue = startDirs
	while (queue.length > 0) {
		f = queue.pop();
		shortList = path.basename(f).split('.')
    if (skipFilt(shortList)) { continue; }
    if (fs.lstatSync(f).isDirectory()) {
      fs.readdirSync(f).forEach((f2) => queue.push(path.join(f,f2)))
    } else {
      source = fs.readFileSync(f).toString();
      cb(source, f)
    }
  }
}

function thenPrint(promise) {
  promise.then((value) => {console.log(JSON.stringify(value))})
}

module.exports = {
  traverseDirs: traverseDirs,
  thenPrint   : thenPrint
}
