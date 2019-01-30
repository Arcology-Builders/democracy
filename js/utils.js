// Utilities
fs = require('fs')
path = require('path')

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
      cb(source, path.basename(f))
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
