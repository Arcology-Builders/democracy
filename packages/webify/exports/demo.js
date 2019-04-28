require('@babel/polyfill')
utils     = require('demo-utils')
keys      = require('demo-keys')
contract  = require('demo-contract')
immutable = require('immutable')

module.exports = {
  BrowserFS: BrowserFS,
  fs       : require('fs'),
  path     : require('path'),
  utils    : utils,
  keys     : keys,
  contract : contract,
  immutable: immutable,
}
