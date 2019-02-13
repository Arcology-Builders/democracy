// Store into a DB that can be backed by filesystem or localStorage,
// depending on whether we are in a browser
// Keys are single file for now

const { DB_DIR, ensureDir, getImmutableKey } = require('./utils')
const fs = require('fs')
const path = require('path')
const { fromJS, List } = require('immutable')

/**
 * Retrieve the value associated with the given key in the given namespace, if it exists
 * Otherwise, give the default value or throw an error.
 */
getSync = (key, defaultValue) => {

  /*
  key = getKeySpace(key, (keyPrefix) => { ensureDir(keyPrefix) })
  
  var newMap = new Map()
  if (!fs.existsSync(dbFile)) {
    if (defaultValue) return defaultValue
    else { throw new Error(`Key ${dbFile} does not exist.`) }
  } else {
   return buildFromDirs(f, () => false)
  }
  const value = fromJS(fs.readFileSync(dbFile))
  console.log(`Reading key ${JSON.stringify(key)} value ${value.toString()}`)
  return value
 */
  return getImmutableKey(key, defaultValue)
}
  
module.exports = getSync
