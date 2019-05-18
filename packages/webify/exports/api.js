require('@babel/polyfill')

const BrowserFS = require('browserfs')
const api = {}

api.initFS = (listingHTTP) => {
  BrowserFS.FileSystem.LocalStorage.Create(function(e, lsfs) {
    BrowserFS.FileSystem.InMemory.Create(function(e, inMemory) {
      BrowserFS.FileSystem.XmlHttpRequest.Create({
        index: listingHTTP || {},
        baseUrl: api.config.DB_URL + '/api',
      }, (e, httpFS) => {
        BrowserFS.FileSystem.MountableFileSystem.Create({
          '/tmp': inMemory,
          '/': lsfs
        }, function(e, mfs) {
          BrowserFS.initialize(mfs)
          // BFS is now ready to use!
        })
      })
    })
  })
}

require('dotenv').config()
api.utils    = require('demo-utils')
api.config   = api.utils.getConfig()
api.eth      = api.utils.getNetwork()
api.fs       = require('fs')
api.path     = require('path')
api.contract = require('demo-contract')
api.keys      = require('demo-keys')
api.tx        = require('demo-tx')
api.immutable = require('immutable')

module.exports = api
