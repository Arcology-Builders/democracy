utils  = require('./src/utils')
Logger = require('./src/logger')
config = require('./src/config')
db     = require('./src/db')
console.log('config ' + JSON.stringify(config))
console.log('db ' + JSON.stringify(db))
console.log('utils ' + JSON.stringify(utils))

module.exports = {
  ...utils,
  ...config,
  ...db,
  Logger: Logger,
  setFS: (_fs) => { db.setStoreFS(_fs); utils.setUtilsFS(_fs) }
}
