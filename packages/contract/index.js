const utils = require('./src/utils')
const cm    = require('./src/contractsManager')
const link  = require('./src/linker')

module.exports = {
  ...utils,
  ...cm,
  ...link,
}
