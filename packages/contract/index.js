'use strict'

/**
 * demo-contract, a package for contract management and reproducible linking and deploying.
 * More details are available in the [demo-contract README]
 * (https://github.com/invisible-college/democracy/blob/master/packages/contract/README.md)
 * @module contract
 */
const utils    = require('./src/utils')
const contract = require('./src/contract')
const cm       = require('./src/contractsManager')
const bm       = require('./src/buildsManager')
const link     = require('./src/linker')
const deploy   = require('./src/deployer')

module.exports = {
  ...utils,
  ...contract,
  ...cm,
  ...bm,
  ...link,
  ...deploy,
}
