'use strict'
const utils  = require('./src/utils')
const logger = require('./src/logger')
const config = require('./src/config')
const db     = require('./src/db')

module.exports = {
  ...utils,
  ...config,
  ...db,
  ...logger,
  setFS   : (_fs) => { db.setStoreFS(_fs); utils.setUtilsFS(_fs) },
  setPath : (_path) => { db.setStorePath(_path); utils.setUtilsPath(_path) }
}
