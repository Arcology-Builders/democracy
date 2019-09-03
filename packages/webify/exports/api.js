/**
 * The main Democracy Web API exported as part of demo-webify webpack'd bundle.
 * Include BrowserFS for backing the file-based Democracy immutable keystore,
 * sending file-based HTTP REST requests, and managing the in-browser wallet.
 *
 * Call api.init() in your page code when the page has finished loading.
 * Afterwards, you usually want to call the following (in order)
 * api.prepareCachedWallet() to load cached Ethereum address / password in localStorage
 * api.prepareErasePassword() to set up timeout functions to erase the password
 * api.prepareUpdateWhileCached() to set up interval functions while password is still cached.
 * @module api
 */
'use strict'
require("babel-core/register")
require('@babel/polyfill')

const BrowserFS = require('browserfs')
const api = {}

/**
 * Initialize the BrowserFS filesystem with the given file listing as an Object of
 * path to null. Each of these paths will be pre-pended with '/api' to match the
 * Democracy REST server.
 *
 * Example:
 *   api.initFS({ 'notes/abc': null })
 *
 *   will map writes of the form fs.writeFileSync('notes/abc') to
 *   a POST request to http://{db_host}:{db_port}/api/notes/abc
 * @param listingHTTP {Object} paths to map to REST calls.
 * @method initFS
 * @memberof module:api
 */
api.initFS = (listingHTTP) => {
  console.log(JSON.stringify(listingHTTP))
  BrowserFS.FileSystem.LocalStorage.Create(function(e, lsfs) {
    BrowserFS.FileSystem.InMemory.Create(function(e, inMemory) {
      BrowserFS.FileSystem.XmlHttpRequest.Create({
        index: listingHTTP || {},
        baseUrl: api.config.DB_URL + '/api',
      }, (e, httpFS) => {
        BrowserFS.FileSystem.MountableFileSystem.Create({
          '/tmp': inMemory,
          '/': lsfs,
          '/api': httpFS,
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
const { isValidAddress } = require('ethereumjs-util')

/**
 * @member utils
 * @memberof module:api
 */
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
api.transform     = require('demo-transform')
api.immutable     = require('immutable')
api.chai          = require('chai')
api.secp256k1     = require('@aztec/secp256k1')
api.toWei         = toWei
api.assert        = api.chai.assert

const { prepareSignerEth } = api.keys.wallet
const { Map } = api.immutable

/**
 * Initialize and populate one-time members of the API
 * @param unlockSeconds {Number} default number of seconds to leave wallet
 *   unlocked in memory, before the next refresh.
 * @method init
 * @memberof module:api
 */
api.init = async({ unlockSeconds }) => {
  if (api.thisAddress) { throw new Error('Already initialized this wallet') }
  await api.contract.init()
  api.chainId = api.contract.getChainIdSync()
  if (!demo.keys.wallet.initialized) {
    await demo.keys.wallet.init({ autoConfig: true, unlockSeconds })
  }
}

/**
 * Prepare, and if necessary, create and/or load, the Ethereum wallet (address/password)
 * combo for this browser.
 * Call if you need to initially unlock the wallet, or to unlock again
 * after it has been automatically relocked, but you don't need to run api.init().
 * If the current address and password combo are not valid,
 * create a new one and save into localStorage.
 * Warns user to write down the password.
 *
 * @param enteredPassword {String} password to unlock api.thisAddress if desired
 * @method prepareCachedWallet
 * @memberof module:api
 */
api.prepareCachedWallet = async ({
  enteredPassword,
}) => {

  // Read any saved account params from keystore and attempt to unlock account
  try {
    api.thisAddress = localStorage.getItem(`demo/${api.chainId}/thisAddress`)
    // TODO: Use an Oauth-like credential forwarding system
    // Currently, if this password / device is stolen, we can disable
    // access to the encryptedJSON on our servers
    // Save this in localStorage and not keystore so we can delete it later
    storedPassword = localStorage.getItem(`demo/${api.chainId}/thisPassword`)
  } catch(e) {
    // Currently getImmutableKey throws an error if key is not found
    console.log(`No previous keys/${api.chainId}/thisAddress ` +
                `or keys/${api.chainId}/thisPassword`)
  }

  let storedPassword
  let newAddress, newPassword

  // Try the entered password
  const existingPassword = storedPassword || enteredPassword
  const valid = await demo.keys.wallet.validatePassword({
    address: api.thisAddress,
    password: existingPassword,
  })
  if (valid) {
    console.log(`Valid password found for ${api.thisAddress}`)
  } else {
    console.log(`No valid password found for ${api.thisAddress}`)
  }

  const { signerEth, address, password } = await prepareSignerEth({
    address   : valid ? api.thisAddress : null,
    password  : valid ? existingPassword : null,
  })

  newAddress  = address
  newPassword = password

  if (['test', 'dev'].indexOf(demo.config.DB_NAMESPACE) !== -1 ) {
    localStorage.setItem(`demo/${api.chainId}/thisPassword`, newPassword)
  } else {
    console.warn("Passwords are not cached locally for production environments.")
    console.warn("Consider using Oauth credentials.")
  } 

  // Update thisAddress if we just created a new one
  api.assert( isValidAddress(newAddress) )

  if ( api.thisAddress != newAddress || existingPassword !== newPassword ) {
    console.warn(`Address ${newAddress}`)
    console.warn(`WRITE THIS DOWN: Password ${newPassword}`)
    console.warn(`We cache your password locally for testing / convenience only.`)
    api.thisAddress = newAddress
    localStorage.setItem(`demo/${api.chainId}/thisAddress`, newAddress )
  }

  return newAddress
}

/**
 * Prepare timeout function to erase the password for this wallet
 * in the given number of seconds.
 * The erasePasswordTime is cached, but the callback function must be manually
 * registered with this function after every refresh.
 *
 * @param erasePasswordSeconds {Number} optional
 *   number of seconds to keep password cached, across all page refreshes.
 *   if missing, use the previously cached erasePasswordTime
 * @param erasePasswordCallback {Function} Optional, function to call when removing password.
 * @method prepareErasePassword
 * @memberof module:api
 */
api.prepareErasePassword = async ({
  erasePasswordSeconds,
  erasePasswordCallback,
}) => {
  const now = Date.now()
  const newErasePasswordTime = now + (erasePasswordSeconds * 1000)
  // Read any erase password time and write back a valid one
  try {
    const erasePasswordTime = localStorage.getItem(`demo/${api.chainId}/erasePasswordTime`)
    api.erasePasswordTime =
      erasePasswordSeconds ? newErasePasswordTime : Number(erasePasswordTime)

  } catch(e) {
    // There was no cached erasePasswordTime
    api.erasePasswordTime = newErasePasswordTime
    localStorage.setItem( `demo/${chainId}/erasePasswordTime`, api.erasePasswordTime )
    console.log(`No password erase time found, ` +
                `erasing at ${api.erasePasswordTime}`)
  }

  // Update the relock function, and clear the old timeout function, if necessary
  if (typeof(erasePasswordCallback) === 'function') {
    api.erasePasswordCallback = erasePasswordCallback
    if (api.erasePasswordTimeoutId) {
      clearTimeout(api.erasePasswordTimeoutId)
    }
    api.erasePasswordTimeoutId = setTimeout(() => {
      api.relockErasePassword()
      if (api.updateIntervalId) {
        clearInterval(api.updateIntervalId)
      }
      // Call this last to overwrite any remaining update intervals
      api.erasePasswordCallback()
    }, api.erasePasswordTime - now)
  }
  console.warn(`Erasing password in ${api.erasePasswordTime - now} seconds`)
}

/**
 * Prepare interval function to update some status as long as password has not been erased.
 * The updateWhileCachedCallback must be registered after every refresh,
 * it is not cached.
 *
 * @param updateSeconds {Number} defaults to 1. Number of seconds to wait between updates.
 * @param updateCallback {Function} Optional, callback function which is given the
 *   number of seconds left before password is erased.
 * @method prepareUpdateWhileCached
 * @memberof module:api
 */
api.prepareUpdateWhileCached = async ({
  updateSeconds = 1,
  updateCallback,
}) => {
  // Update the update function, and clear the old interval function, if necessary
  if (typeof(updateCallback) === 'function' && typeof(updateSeconds) === 'number') {
    console.log(`Registered update callback every ${updateSeconds} seconds`)
    api.updateCallback = updateCallback
    if (api.updateIntervalId) {
      clearInterval(api.updateIntervalId)
    }
    api.updateIntervalId = setInterval(async () => {
      await api.updateCallback(api.erasePasswordTime - Date.now())
    }, updateSeconds * 1000)
  }

}

/**
 * Relock all unlocked accounts in the wallet, clear the saved password and
 * associated timeout/interval IDs and callback functions.
 * Called primarily within api.prepareErasePassword.
 * @method relockErasePassword
 * @memberof module:api
 */
api.relockErasePassword = () => {
  demo.keys.wallet.shutdownSync()
  localStorage.setItem(`demo/${api.chainId}/thisPassword`, null)
  localStorage.setItem(`demo/${api.chainId}/relockTime`, null )
  console.log("Erasing password and relocking wallet. Hope you wrote it down.")
}

// So far, we can just prepend 0x04 to the publicKey and have it work with
// aztec.note.create
/*
api.createAztecAccount = () => {
  const {
    privateKey,
    publicKey,
    address,
  } = api.secp256k1.generateAccount()
  api.assert.equal( publicKey.length, 132 )
  const account = api.keys.createFromPrivateString(privateKey.slice(2))
  api.assert.equal( account.get('addressPrefixed'), address )
  return account
    .set('publicPrefixed', publicKey)
    .set('publicString', publicKey.slice(2))
}
*/

/**
 * Fund `api.thisAddress` from the given funderAddress and password.
 * A convenience method primarily for funding test accounts.
 *
 * @param ethValue {String} decimal value in ETH to fund, as a String
 * @param funderAddress {String} `0x`-prefixed Ethereum address of funder.
 * @param funderPassword {String} password for above address.
 */
api.fundWallet = async ({ ethValue, funderAddress, funderPassword }) => {
  if (!api.thisAddress) { throw new Error('Call initWallet() first to unlock account') }
  const { signerEth: funderEth, address, password } = await prepareSignerEth({
    address: funderAddress,
    password: funderPassword, 
  })
  api.assert.equal( funderAddress, address,
               `You cannot create a new address ${address} for funding.`)
  api.assert.equal( funderPassword, password,
               `You cannot create a new password for funding.`)
  api.keys.wallet.pay({
    weiValue    : toWei(ethValue, 'ether'),
    fromAddress : funderAddress,
    toAddress   : api.thisAddress,
  })
  demo.keys.wallet.lastSignerEth = demo.keys.wallet.signersMap[api.thisAddress]
}

module.exports = api
