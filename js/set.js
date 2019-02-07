// Store into a DB that can be backed by filesystem or localStorage,
// depending on whether we are in a browser
// Keys are single file for now

const { DB_DIR, ensureDir } = require('./utils')
const fs = require('fs')
const path = require('path')
const assert = require('assert')
const { List, Map } = require('immutable')

/**
 * Sets the given key (should be a string) to the given value (arbitrary JSON)
 * @param namespace a named subset of given values for organization purposes
 * @param key a string key
 * @param value arbitrary JSON (either an Immutable List or Map) to associate with key
 * @return true if writing succeeded (key did not exist before) false otherwise
 */
setSync = (namespace, key, value) => {
  
  const dbDir = path.join(`${DB_DIR}`,`${namespace}`)
  ensureDir(DB_DIR)
  ensureDir(dbDir)

  assert(typeof(key) === 'string')
  assert(Map.isMap(value) || List.isList(value) || !value)

  const dbFile = path.join(dbDir, `${key}.json`)

  if (fs.existsSync(dbFile)) {
    if (!value) {
      fs.unlinkSync(dbFile)
      return true
    } else { 
      console.error(`Key ${dbFile} exists and is read-only.`)
      return false
    }
  }
  console.log(`Setting key ${key} value ${JSON.stringify(value.toJS())}`)
  fs.writeFileSync(dbFile, JSON.stringify(value.toJS()))
  return true
}
  
module.exports = setSync
