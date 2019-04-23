const keys     = require('demo-keys')
const utils    = require('demo-utils')
const contract = require('demo-contract')
const compile  = require('demo-compile')
const tx       = require('demo-tx')

module.exports = {
  ...keys,
  ...utils,
  ...contract,
  ...compile,
  ...tx,
}
