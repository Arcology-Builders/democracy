const fs = require('fs')
const path = require('path')
const { traverseDirs, ensureDir, Logger } = require('demo-utils')
const LOGGER = new Logger('webify')
const { List } = require('immutable')
const assert = require('chai').assert

DIST_DIR = 'interim'
REQUIRE_PATH_PATTERN = /require\(path.join\(__dirname,\s*['"]([a-zA-Z\-\.0-9]+)['"]\)\)/g

function replace(source) {
  return `require('./${source}')`
}

const webify = (startDir) => {
  assert(startDir, 'No start directory provided for webifying.')

  let currentDir
  let startParts = List(startDir.split(path.sep))
  let dirPrefixParts = startParts.take(startParts.count()-1)

  LOGGER.info(`StartDir ${startDir}`)
  LOGGER.info(`Dir Prefix Parts ${dirPrefixParts.toString()}`)

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

  traverseDirs(
    [startDir],
    (fnParts, f) => {
      console.log(`f ${f}`)
      const stat = fs.lstatSync(f)
      return f.endsWith('node_modules') || f.endsWith('build') || stat.isSymbolicLink() ||
        (fnParts.length > 1 && (!fnParts[1].startsWith('js') || fnParts[1].startsWith('dat')))
    },
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
      if (dir.endsWith('node_modules')) { return }
      currentDir = path.join(DIST_DIR, relativePath(dirPrefixParts, dir));
      ensureDir(currentDir)
      //console.log(`dir ${currentDir}`)
    }
  )
}

module.exports = webify

if (require.main === module) {
  webify(process.argv[2])
}
