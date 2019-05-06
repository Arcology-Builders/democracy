'use strict'
const assert      = require('chai').assert
const { List, Map }
                  = require('immutable')
const http        = require('http')
const url         = require('url')
const { Logger }  = require('demo-utils')
const LOGGER      = new Logger('client')

const client = {}

const RETRY_COUNT = 5
const BACKOFF_START = 100 // 100 ms to start

const retryPromise = async (promCreator, bmHostName, bmPort, tag) => {
  const delayPromCreator = async (delay) => {
    return new Promise((resolve, reject) => {
      setTimeout( () => {
        promCreator(resolve, reject).then((val) => resolve(val))
      }, delay )
    }) 
  }
  let _success = false
  let _result
  let retry = RETRY_COUNT
  let delay = BACKOFF_START
  while (!_success && retry > 0) {
    const perturb = Math.round(Math.random() * delay)
    if (tag) { LOGGER.debug('TAG', tag) }
    LOGGER.debug(`Attempting ${bmHostName}:${bmPort} after delay ${delay+perturb} with ${retry} retries left`)
    let {success: _success, result: _result} = await delayPromCreator(delay + perturb)
    if (_success) {
     return _result
    }
    retry -= 1
    delay *= 2
  }
  // We've exhaused all retries
  if (tag) { LOGGER.debug('TAG', tag) }
  LOGGER.debug(tag, "Exchausted all retries")
  throw new Error(`Unable to connect to ${bmHostName}:${bmPort} after ${RETRY_COUNT} retries`)
}


client.RemoteDB = class {

  constructor(host, port) {
    this.host = host
    this.port = port
    this.url  = `http://${host}:${port}`
  } 

  async config() {
    return getHTTP('/api/config')
  } 

  async postHTTP(_apiPath, _bodyObj, _overwrite) {
    const post_data = JSON.stringify(_bodyObj)
    const post_options = {
      host: this.host,
      port: this.port,
      path: _apiPath,
      method: 'POST',
      headers: {
          'Content-Type'        : 'application/json',
          'Democracy-Overwrite' : String(_overwrite),
          'Content-Length'      : Buffer.byteLength(post_data),
      }
    }
    const postPromCreator = (resolve, reject) => {
      return new Promise((resolve, reject) => {
        const post_req = http.request(post_options, (res) => {
          res.setEncoding('utf8')
          const data = []
          res.on('data', (chunk) => {
            data.push(Buffer.from(chunk))
          }).on('end', () => {
            const body = Buffer.concat(data)
            resolve(body.toString())
          }).on('error', (err) => {
            LOGGER.debug('res error', err)
            reject(err)
          })
        })

        post_req.on('error', (err) => {
          LOGGER.debug('post req error', err)
          reject(err)
        })
        post_req.on('socket', function(socket) { 
          socket.setTimeout(2000, function () {   // set short timeout so discovery fails fast
              var e = new Error ('Timeout connecting to ' + this.host)
              e.name = 'Timeout';
             reject(e)
          })
        })
        post_req.write(post_data)
        post_req.end()
      })
      .then((val) => { resolve({success: true, result: val }) })
      .catch((e) => { resolve({success: false, result: e }) }) 
    }
    if (!_bodyObj) { throw Error(`No deleting of remote key ${_apiPath} allowed.`) }
    return retryPromise(postPromCreator, this.host, this.port, 'POST')
  }
 
  async getHTTP(_apiPath) {
    const getPromCreator = (resolve, reject) => {
      return new Promise((resolve, reject) => {
        const getURL = url.parse(this.url + _apiPath)
        const req = http.get(getURL, (res) => {
          const data = []
          res.on('data', (chunk) => {
            data.push(chunk);
          }).on('end', () => {
            const body = Buffer.concat(data)
            LOGGER.debug('get data', body.toString())
            resolve(body.toString())	
          }).on('error', (err) => {
            LOGGER.debug('get req error', err)
            reject(err)
          })
        })
        req.on('socket', function(socket) { 
          socket.setTimeout(2000, function () {   // set short timeout so discovery fails fast
              var e = new Error ('Timeout connecting to ' + this.host)
              e.name = 'Timeout';
              //req.abort();  // kill socket
              LOGGER.debug('get socket error', e)
             reject(e)
          })
        })
        req.on('error', (err) => {
          LOGGER.debug('get req error', err)
          reject(err)
        })

      }) 
      .then((val) => { resolve({success: true, result: val }) })
      .catch((e) => { resolve({success: false}) })
    }
    return retryPromise(getPromCreator, this.host, this.port, 'GET')
  }

}

module.exports = client
