// Store into a DB that can be backed by filesystem or localStorage,
// depending on whether we are in a browser
// Keys are single file for now

const { DB_DIR, ensureDir } = require('./utils')
const fs = require('fs')
const path = require('path')
const { fromJS } = require('immutable')

/**
 * Retrieve the value associated with the given key in the given namespace, if it exists
 * Otherwise, give the default value or throw an error.
 */
getSync = (namespace, key, defaultValue) => {
  
  const dbDir = path.join(`${DB_DIR}`,`${namespace}`)
  ensureDir(DB_DIR)
  ensureDir(dbDir)

  const dbFile = path.join(dbDir, `${key}.json`)

  if (!fs.existsSync(dbFile)) {
    if (defaultValue) return defaultValue
    else { throw new Error(`Key ${dbFile} does not exist.`) }
  }
  const value = fromJS(fs.readFileSync(dbFile))
  console.log(`Reading key ${JSON.stringify(key)} value ${value.toString()}`)
  return value
}
  
module.exports = getSync
