'use strict'

const { Logger, fromJS, toJS } = require('demo-utils')
const LOGGER = new Logger('client/helpers')
const { RemoteDB } = require('./client')
const { BuildsManager } = require('demo-contract')

const helpers = {}

helpers.createBM = ({sourcePath, chainId, hostname, port}) => {
  const r = new RemoteDB(hostname, port)
  let inputter
  let outputter

  if (hostname && port) {
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
