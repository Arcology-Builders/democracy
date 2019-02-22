const fs = require('fs')
const path = require('path')
const demo = require('democracy.js')
const { List } = require('immutable')
const assert = require('chai').assert

DIST_DIR = 'dist'
REQUIRE_PATH_PATTERN = /require\(path.join\(__dirname, \'([a-zA-Z\-\.0-9]+)\'\)\)/g

function replace(source) {
  return `require('./${source}')`
}

if (process.argv.length < 3) {
  console.log(`Usage: ${process.argv[1]} [startDir]`)
  process.exit(1)
}

const startDir = process.argv[2]
console.log(`StartDir ${startDir}`)
let currentDir
let startParts = List(startDir.split(path.sep))
let dirPrefixParts = startParts.take(startParts.count()-1)

console.log(`StartDir ${startDir}`)
console.log(`Dir Prefix Parts ${dirPrefixParts.toString()}`)

function relativePath(dirPrefixParts, f) {
  const parts = List(f.split(path.sep))
  const prefixCount = dirPrefixParts.count()
  const partsCount = parts.count()
  assert(prefixCount < partsCount)
  const prefix = parts.take(prefixCount)
  assert(prefix.equals(dirPrefixParts), `${prefix.toString()} does not equal ${dirPrefixParts.toString()}`)
  return parts.slice(prefixCount - partsCount).join(path.sep)
}

assert(relativePath(dirPrefixParts, startDir) === path.basename(startDir))
assert(relativePath(List(['a','b','c']), 'a/b/c/d/e') === 'd/e' )

demo.traverseDirs(
  [startDir],
  (fnParts, f) => {
    const stat = fs.lstatSync(f)
    return fnParts.length > 1 && (fnParts[1] !== 'js' || stat.isSymbolicLink() || stat.isDirectory()) },
  (source, f) => { 
    let match
    let textSoFar = source
    while (match = REQUIRE_PATH_PATTERN.exec(source)) {
      const replaced = replace(match[1])
      console.log(`Replacing ${match[0]} with ${replaced}`)
      textSoFar = textSoFar.replace(match[0], replaced)
    }
    fs.writeFileSync(path.join(DIST_DIR, relativePath(dirPrefixParts, f)), textSoFar)
  }, // do nothing in this path
  (dir) => {
    currentDir = path.join(DIST_DIR, relativePath(dirPrefixParts, dir));
    demo.ensureDir(currentDir)
    console.log(`dir ${currentDir}`)
  }
)

