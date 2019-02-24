// Store into a DB that can be backed by filesystem or localStorage,
// depending on whether we are in a browser
// Keys are single file for now

const { DB_DIR, ensureDir, setImmutableKey } = require('./utils')
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
setSync = (key, value) => {

  return setImmutableKey(key, value)
}
  
module.exports = setSync
