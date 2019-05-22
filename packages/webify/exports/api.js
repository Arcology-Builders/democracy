'use strict'
require("babel-core/register")
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
const { toWei } = require('web3-utils')

api.utils         = require('demo-utils')
api.LOGGER        = new api.utils.Logger('demo')
api.get           = api.utils.getImmutableKey
api.get           = api.utils.getImmutableKey
api.set           = api.utils.setImmutableKey
api.config        = api.utils.getConfig()
api.eth           = api.utils.getNetwork()
api.fs            = require('fs')
api.path          = require('path')
api.process       = process
api.processGlobal = require('processGlobal')
api.buffer        = require('buffer')
api.bufferGlobal  = require('bufferGlobal')
api.contract      = require('demo-contract')
api.keys          = require('demo-keys')
api.tx            = require('demo-tx')
api.immutable     = require('immutable')
api.chai          = require('chai')
api.toWei         = toWei

const { prepareSignerEth } = api.keys.wallet
const { Map } = api.immutable

api.initWallet = async () => {
  if (api.thisAddress) { throw new Error('Already initialized this wallet') }
  await api.contract.init()
  await demo.keys.wallet.init({ autoConfig: true, unlockSeconds: 60 })

  let enteredPassword

  try {
    api.thisAddress = api.get("keys/thisAddress").get('address')
    // TODO: Use an Oauth-like credential forwarding system
    if (api.thisAddress) {
       enteredPassword = prompt("Stick 'em up! Give us the password for " + api.thisAddress)
    }
  } catch(e) {
    // Currently getImmutableKey throws an error if key is not found
    console.log("No previous Ethereum address at keys/thisAddress,  creating new one.")
  }

  const { signerEth: deployerEth, address, password }
     = await prepareSignerEth({ address: api.thisAddress, password: enteredPassword})
  if (!api.thisAddress) {
    console.log("Saving new signer", address, password)
    api.thisAddress = address
    api.set("keys/thisAddress", new Map({address: address}))
  }
  api.LOGGER.info(`Address ${address}`)
  api.LOGGER.info(`WRITE THIS DOWN: Password ${password}`)
  api.LOGGER.info(`Unlocked wallet for 60 seconds`)
  return address
}

api.fundWallet = async ({ ethValue, funderAddress }) => {
  if (!api.thisAddress) { throw new Error('Call initWallet() first to unlock account') }
  const enteredPassword = prompt("Stick 'em up! Give us the password for " + funderAddress)
  const { signerEth: funderEth } = await prepareSignerEth({
    address: funderAddress,
    password: enteredPassword, 
  })
  api.keys.wallet.pay({
    weiValue    : toWei(ethValue, 'ether'),
    fromAddress : funderAddress,
    toAddress   : api.thisAddress,
  })
  demo.keys.wallet.lastSignerEth = demo.keys.wallet.signersMap[api.thisAddress]
}

module.exports = api
