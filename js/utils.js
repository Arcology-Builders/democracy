// Utilities
fs = require('fs')
path = require('path')

const { Map } = require('immutable')

LIB_PATTERN = /__(([a-zA-Z])+\/*)+\.sol:[a-zA-Z]+_+/g

function print(data) {
  console.log(JSON.stringify(data, null, '  '))
}

function ensureDir(dirName) {
  if (!fs.existsSync(dirName)) { fs.mkdirSync(dirName, { recursive: true } ) }
}

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

function getLinks(networkId) {
  linkMap = {}
  traverseDirs(
    [`links/${networkId}`],
    (fnParts) => { return (fnParts.length > 1 && !fnParts[1].startsWith('json')) },
    // Link names will have the form <contractName>-<linkID>, do we need to
    // differentiate different deploy IDs for a single contract name?
    (source,f) => { linkMap[path.basename(f)] = JSON.parse(source) }
  )
  return Map(linkMap)
}


function getDeploys(networkId) {
  deployMap = {}
  traverseDirs(
    [`deploys/${networkId}`],
    (fnParts) => { return (fnParts.length > 1 && !fnParts[1].startsWith('json')) },
    // Deploy names will have the form <contractName>-<deployID>, do we need to
    // differentiate different deploy IDs for a single contract name?
    (source,f) => { deployMap[path.basename(f)] = Map(JSON.parse(source)) }
  )
  return Map(deployMap)
}

function thenPrint(promise) {
  promise.then((value) => {console.log(JSON.stringify(value))})
}

module.exports = {
  traverseDirs: traverseDirs,
  thenPrint   : thenPrint,
  print       : print,
  ensureDir   : ensureDir,
  getDeploys  : getDeploys,
  LIB_PATTERN : LIB_PATTERN,
}
