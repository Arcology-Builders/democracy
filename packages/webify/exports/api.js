'use strict'
require("babel-core/register")
require('@babel/polyfill')

const BrowserFS = require('browserfs')
const api = {}

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
api.secp256k1     = require('@aztec/secp256k1')
api.toWei         = toWei
api.assert        = api.chai.assert

const { prepareSignerEth } = api.keys.wallet
const { Map } = api.immutable

api.initWallet = async ({
  unlockSeconds = 6000,
  address,
  enteredPassword,
  relockCallBack
}) => {
  if (api.thisAddress) { throw new Error('Already initialized this wallet') }
  await api.contract.init()
  const chainId = api.contract.getChainIdSync()
  if (!demo.keys.wallet.initialized) {
    await demo.keys.wallet.init({ autoConfig: true, unlockSeconds })
  }

  const now = (new Date()).getTime()

  // Read any saved relock time and write back a valid one
  try {
    const relockTime = localStorage.getItem(`demo/${chainId}/relockTime`)
    api.relockTime = Number(relockTime)
    if (!api.relockTime) { throw new Error('No relock time found') }
  } catch(e) {
    api.relockTime = now + (unlockSeconds*1000)
    localStorage.setItem( `demo/${chainId}/relockTime`, api.relockTime )
    console.log(`No account relock time found, ` +
                `locking again at ${api.relockTime}`)
  }

  let storedPassword

  // Read any saved account params from keystore and attempt to unlock account
  try {
    api.thisAddress = localStorage.getItem(`demo/${chainId}/thisAddress`)
    // TODO: Use an Oauth-like credential forwarding system
    // Currently, if this password / device is stolen, we can disable
    // access to the encryptedJSON on our servers
    // Save this in localStorage and not keystore so we can delete it later
    storedPassword = localStorage.getItem(`demo/${chainId}/thisPassword`)
  } catch(e) {
    // Currently getImmutableKey throws an error if key is not found
    console.log("No previous Ethereum address at keys/thisAddress.")
  }

  let newAddress, newPassword

  // Try the entered password
  try {
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

    newPassword = password
    newAddress = address

  } catch(e) {

    console.error(JSON.stringify(e))

  }
  if (['test', 'development'].indexOf(demo.config.DB_NAMESPACE) !== -1 ) {
    localStorage.setItem(`demo/${chainId}/thisPassword`, newPassword)
  } else {
    console.log("Passwords are not cached locally for production environments.")
  } 

  // Relock the password, possibly not in this session
  if (api.relockTime > now) {
    api.relockTimeoutId = setTimeout(() => { api.relockWallet() },
                                     api.relockTime - now)
  }

  // Update thisAddress if we just created a new one
  if ( isValidAddress(newAddress) ) {
    console.log("Saving new signer", newAddress, newPassword)
    api.thisAddress = newAddress
    localStorage.setItem(`demo/${chainId}/thisAddress`, newAddress )
  }
  console.log(`Address ${newAddress}`)
  console.log(`WRITE THIS DOWN: Password ${newPassword}`)
  console.log(`We cache your password locally for testing / convenience only.`)
  console.log(`Unlocked wallet for ${unlockSeconds} seconds`)
  return newAddress
}

api.unlockWallet = () => {
}

/**
 * Relock all unlocked accounts in the wallet,
 * clear the saved password and relockTime.
 */
api.relockWallet = (cb) => {
  demo.keys.wallet.shutdownSync()
  const chainId = api.contract.getChainIdSync()
  localStorage.setItem(`demo/${chainId}/thisPassword`, null)
  localStorage.setItem(`demo/${chainId}/relockTime`, null )
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
