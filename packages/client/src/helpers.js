'use strict'

const { Logger, fromJS, toJS, equal, getConfig, getImmutableKey, setImmutableKey }
  = require('demo-utils')
const LOGGER = new Logger('client/helpers')

const { RemoteDB } = require('./client')
const assert = require('chai').assert

const helpers = {}

helpers.createInOut = ({hostname, port, autoConfig}) => {
  
  // Autoconfig'd URL and host
  const autoURL = getConfig()['DB_URL']
  const [ autoHostname, autoPort ] = autoURL.split('://')[1].split(':')
  assert(autoHostname && autoPort, `Invalid autoconfig URL ${autoURL}`)
  LOGGER.debug('createInOut autoconfig URL', autoConfig, autoHostname, autoPort)

  const _hostname = (autoConfig) ? autoHostname : hostname
  const _port     = (autoConfig) ? autoPort     : port

  const r = new RemoteDB(_hostname, _port)

  const useHostAndPort = (_hostname && _port)
  const remoteInputter = async (key, def) => {
    return fromJS(JSON.parse(await r.getHTTP(`/api/${key}`, def))) } 
  const remoteOutputter = async (key, val, ow) => {
    return r.postHTTP(`/api/${key}`, toJS(val), ow) } 
  LOGGER.debug('useHostAndPort', useHostAndPort)

  const inputter = (useHostAndPort) ? remoteInputter : getImmutableKey
  const outputter = (useHostAndPort) ? remoteOutputter : setImmutableKey

  return {
    inputter: inputter,
    outputter: outputter,
  }
}

helpers.delayedGet = (getCall, expected, eq) => {
  const _eq = (eq) ? eq : equal 
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      const res = await getCall()
      if ( _eq(res, expected) ) { resolve(res) }
      else {
        LOGGER.debug("res", typeof(res), res)
        const e = new Error(`Expected ${res} to equal ${expected}`)
        reject(e) }
    }, 1000)
  })
}

helpers.syncify = (asyncFunc, done) => {
  asyncFunc().then(() => { done() } )
}

module.exports = helpers
