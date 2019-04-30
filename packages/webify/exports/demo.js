require('@babel/polyfill')
const utils     = require('demo-utils')
const keys      = require('demo-keys')
const contract  = require('demo-contract')
const client    = require('demo-client')
const immutable = require('immutable')

module.exports = {
  BrowserFS: BrowserFS,
  fs       : require('fs'),
  path     : require('path'),
  utils    : utils,
  keys     : keys,
  client   : client,
  contract : contract,
  immutable: immutable,
}
