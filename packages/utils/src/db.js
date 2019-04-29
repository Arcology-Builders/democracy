'use strict'
const fs          = require('fs')
const path        = require('path')
const assert      = require('chai').assert
const { List, Map }
                  = require('immutable')
const http        = require('http')
const url         = require('url')
const { Logger }  = require('./logger')
const LOGGER      = new Logger('db')
const { isBrowser, ensureDir, DB_DIR, buildFromDirs } = require('./utils')

/**
 * Take the callback action for every level in a hierarchical key space
 */
const getFileKeySpace = (key, cb) => {
  const keySpaces = List(key.split('/')) // in both localstorage and fs, we use UNIX sep
  const dirSpaces = keySpaces.slice(0,-1)
  dirSpaces.map((dir,i) => { cb(keySpaces.slice(0,i+1)) })
  const keyBase = keySpaces.get(-1)
  const dbDir = path.join(`${DB_DIR}`, ...dirSpaces.toJS())

  // Return the base filename and don't add .json extension
  // b/c the latter is only correct behavior for setImmutableKey
  // and this method is also used by getImmutableKey
  return path.join(dbDir, `${keyBase}`)
}

const store = {}

/**
 * set an immutable key, possibly moving aside previous immutable values
 * @param {fullKey} the full path to the key, separated by `/`
 * @param {value} the value to associate, either an Immutable {List}, {Map}, or null
 * @param {overwrite} true if are allowed to move aside previous immutable keys
 */
store.setImmutableKey = (fullKey, value, overwrite) => {
  assert(typeof(fullKey) === 'string')
  assert(Map.isMap(value) || List.isList(value) || !value)
 
  // TODO we need the same delete key logic below for browser 
  /*
  if (isBrowser()) {
    const valString = (value) ? JSON.stringify(value.toJS()) : value
    localStorage.setItem(fullKey, valString)
  } else {
 */
    ensureDir(DB_DIR)
    const dbFile = getFileKeySpace(fullKey, (keyPrefixes) => {
      ensureDir(path.join(DB_DIR, ...keyPrefixes)) })
    const now = Date.now()
    LOGGER.info(`overwrite ${overwrite}`)

    if (fs.existsSync(`${dbFile}.json`)) {
      if (!value || overwrite) {
        // We never delete, only move to the side
        fs.renameSync(`${dbFile}.json`, `${dbFile}.json.${now}`) 
        if (!overwrite) {
          return true
        }
      } else {
        LOGGER.error(`Key ${dbFile}.json exists and is read-only.`)
        throw new Error(`Key ${dbFile}.json exists and is read-only.`)
      }
    } else if (fs.existsSync(dbFile)) {
      if (!value) {
        LOGGER.debug(`Deleting sub-key ${dbFile}`)
        fs.renameSync(`${dbFile}`, `${dbFile}.${now}`) 
        return true
      } else { 
        throw new Error(`Key ${dbFile} exists and is not a JSON file.`)
      }
    } else if (!value) {
      //LOGGER.debug(`Unnecessary deletion of non-existent key ${fullKey}`)
      return true
    }
    const valJS = (Map.isMap(value) || List.isList(value)) ? value.toJS() : value
    //LOGGER.debug(`Setting key ${fullKey} value ${JSON.stringify(valJS)}`)
    fs.writeFileSync(`${dbFile}.json`, JSON.stringify(valJS))
    return true
    /*
  }
*/
}

store.getImmutableKey = (fullKey, defaultValue) => {
  assert(typeof(fullKey) === 'string')
/*
  if (isBrowser()) {
    const value = fromJS(JSON.parse(localStorage.getItem(fullKey)))
    if (!value) {
      if (defaultValue) return defaultValue
      else { throw new Error(`Key ${fullKey} does not exist.`) }
    }
    return value
  } else {
 */
    const dbFile = getFileKeySpace(fullKey, () => {})
    if (fs.existsSync(`${dbFile}.json`)) {
      return buildFromDirs(`${dbFile}.json`, () => {return false})
    } else if (fs.existsSync(dbFile)) {
      return buildFromDirs(dbFile,
        // Return undeleted keys like a.json but not deleted keys a.json.1
        (fnParts) => { return ((fnParts.length > 1) && (fnParts[1] !== 'json')) ||
                              fnParts.length > 2 })
    } else {
      if (defaultValue) return defaultValue
      else { throw new Error(`Key ${dbFile} does not exist.`) }
    }
    /*
  }
 */
}  

module.exports = store
