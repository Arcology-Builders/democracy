'use strict'

const { Logger, fromJS, toJS, getConfig } = require('demo-utils')
const LOGGER = new Logger('client/helpers')

const { RemoteDB } = require('./client')
const { BuildsManager } = require('demo-contract')
const assert = require('chai').assert

const helpers = {}

helpers.createBM = ({sourcePath, chainId, hostname, port, autoConfig}) => {
  let _hostname = hostname
  let _port = port
  if (autoConfig) {
    const url = getConfig()['DB_URL']
    const urlParts = url.split('://')[1].split(':')
    assert.equal(urlParts.length, 2)
    LOGGER.debug('Creating BM with', url)
    _hostname = urlParts[0]
    _port     = urlParts[1]
  }
  const r = new RemoteDB(_hostname, _port)
  let inputter
  let outputter

  if (_hostname && _port) {
    inputter = async (key, def) => {
      return fromJS(JSON.parse(await r.getHTTP(`/api/${key}`, def))) }
    outputter = async (key, val, ow) => {
      return r.postHTTP(`/api/${key}`, toJS(val), ow) }
  }

  return new BuildsManager({
    startSourcePath: sourcePath,
    chainId        : chainId,
    inputter       : inputter,
    outputter      : outputter,
  })
}

helpers.delayedGet = async (getCall, expected, logger) => {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      const res = await getCall()
      if (res === expected) { resolve(res) }
      else {
        if (logger) { logger.error(`Expected ${res} to equal ${expected}`) }
        reject(res, expected) }
    }, 1000)
  })
}

helpers.syncify = (asyncFunc, done) => {
  asyncFunc().then(() => { done() } )
}

module.exports = helpers
