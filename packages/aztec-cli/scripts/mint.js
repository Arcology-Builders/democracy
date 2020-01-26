#!/usr/bin/env node
'use strict'
const { mint }      = require('../src/mint')
const { Map }       = require('immutable')
const BN            = require('bn.js')
const { parsed }    = require('dotenv').config()
const { wallet }    = require('demo-keys')
const { getConfig } = require('demo-utils')
const { AZTEC_TYPES : TYPES } = require('demo-aztec-lib')

const minteeAddress = process.argv[4]
const minteePublicKey = process.argv[5]
console.log(`Address   : ${minteeAddress}`)
console.log(`Public Key: ${minteePublicKey}`)

const useMintee = !TYPES.ethereumAddress(minteeAddress)['error'] && !TYPES.aztecPublicKey(minteePublicKey)['error']
console.log(`isAddress ${TYPES.ethereumAddress(minteeAddress)['error']}`)
console.log(`isPassword ${TYPES.aztecPublicKey(minteePublicKey)['error']}`)

if (useMintee) {
  console.log('Detected mintee')
}

const testIndex     = process.argv[4] || 1
const deployerIndex = Number(process.argv[5]) || 0
console.log('testIndex', testIndex)

const deployerAddress = deployerIndex > 0 ?
  parsed[`TEST_ADDRESS_${deployerIndex}`]  : getConfig()['DEPLOYER_ADDRESS']
const deployerPassword = deployerIndex > 0 ?
  parsed[`TEST_PASSWORD_${deployerIndex}`] : getConfig()['DEPLOYER_PASSWORD']

mint(Map({
  tradeSymbol      : process.argv[2] || 'AAA',
  minteeAddress    : useMintee ? minteeAddress : parsed[`TEST_ADDRESS_${testIndex}`],
  minteePublicKey  : useMintee ? minteePublicKey : parsed[`TEST_PUBLIC_KEY_${testIndex}`],
  deployerAddress  : deployerAddress,
  deployerPassword : deployerPassword,
  minteeAmount     : new BN(process.argv[3]) || new BN(0),
  mintFromZero     : Boolean(process.argv[6]),
  testValueETH     : '0.15',
  testAccountIndex : 0,
})).then((result) => {
  console.log(`minteeNoteHash`, result.get('minteeNoteHash'))
  console.log('Minting complete.')
  wallet.shutdownSync()
})
