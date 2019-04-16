const fs          = require('fs')
const path        = require('path')
const assert      = require('chai').assert
const { List, Map }
                  = require('immutable')
const http        = require('http')
const url         = require('url')
const Logger      = require('./logger')
const LOGGER      = new Logger('RemoteDB')
const { isBrowser, ensureDir, DB_DIR, buildFromDirs } = require('./utils')

const RemoteDB = class {

  constructor(_host, _port) {
    this.host = _host
    this.port = _port
    this.url  = `http://${_host}:${_port}`
  } 

  async config() {
    return getHTTP('/api/config')
  } 

  async postHTTP(_apiPath, bodyObj) {
    const post_data = JSON.stringify(bodyObj) //querystring.stringify(bodyObj)
    const post_options = {
      host: this.host,
      port: this.port,
      path: _apiPath,
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(post_data),
      }
    }
    return new Promise((resolve, reject) => {
			const post_req = http.request(post_options, (res) => {
				res.setEncoding('utf8')
				const data = []
				res.on('data', (chunk) => {
					data.push(Buffer.from(chunk))
          LOGGER.debug('data', data)
				}).on('end', () => {
          LOGGER.debug('data', data)
					const body = Buffer.concat(data)
          resolve(body.toString())
				}).on('error', (err) => {
          LOGGER.error('res error', err)
          reject(err)
        })
			})

      post_req.on('error', (err) => {
        LOGGER.error('req error', err)
        reject(err)
      })
			post_req.write(post_data)
			post_req.end()
    })
  }
 
  async getHTTP(_apiPath) {
    return new Promise((resolve, reject) => {
      http.get(url.parse(this.url + _apiPath), (res) => {
				const data = []
				res.on('data', (chunk) => {
					data.push(chunk);
				}).on('end', () => {
					const body = Buffer.concat(data)
				  resolve(body.toString())	
				}).on('error', (err) => {
					reject(err)
        })
      })
    }) 
  }

  /**
   * Asynchronous function for writing a key-value pair to a remote REST interface.
   * @param key
   * @param value
   */
  async set(key, value) {
  }

  async get(key, defaultValue) {
  }

}

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

store.setStoreFS = (_fs) => {
  store.fs = _fs
}

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

    if (store.fs.existsSync(`${dbFile}.json`)) {
      if (!value || overwrite) {
        // We never delete, only move to the side
        store.fs.renameSync(`${dbFile}.json`, `${dbFile}.json.${now}`) 
        if (overwrite) {
          LOGGER.debug(`Overwriting key ${fullKey} with ${value}`)
          // don't return here b/c we need to write the new key file below
        } else {
          LOGGER.debug(`Marking key ${fullKey} deleted at time ${now}`)
          return true
        }
      } else {
        throw new Error(`Key ${dbFile}.json exists and is read-only.`)
      }
    } else if (store.fs.existsSync(dbFile)) {
      if (!value) {
        LOGGER.debug(`Deleting sub-key ${dbFile}`)
        store.fs.renameSync(`${dbFile}`, `${dbFile}.${now}`) 
        return true
      } else { 
        throw new Error(`Key ${dbFile} exists and is not a JSON file.`)
      }
    } else if (!value) {
      LOGGER.debug(`Unnecessary deletion of non-existent key ${fullKey}`)
      return true
    }
    const valJS = (Map.isMap(value) || List.isList(value)) ? value.toJS() : value
    LOGGER.debug(`Setting key ${fullKey} value ${JSON.stringify(valJS)}`)
    store.fs.writeFileSync(`${dbFile}.json`, JSON.stringify(valJS))
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
    if (store.fs.existsSync(`${dbFile}.json`)) {
      return buildFromDirs(`${dbFile}.json`, () => {return false})
    } else if (store.fs.existsSync(dbFile)) {
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

module.exports = {
  RemoteDB       : RemoteDB,
  ...store,
}
