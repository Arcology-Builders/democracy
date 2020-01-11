#!/usr/bin/env node
'use strict'
const assert = require('chai').assert
const { cx } = require('../src/cx')
const { proxy1Cx } = require('../src/proxy1')
const { Map } = require('immutable')
const { parsed } = require('dotenv').config()
const { wallet } = require('demo-keys')

const tradeSymbol       = process.argv[2]
const senderNoteHash    = process.argv[3]
const amount            = process.argv[4]
const transfererIndex   = process.argv[5] || 4 
const senderIndex       = process.argv[6] || 4 
const receiverIndex     = process.argv[7] || 2 
const transferAll       = process.argv[8]
const cxName            = process.argv[9] || 'cx'

console.log(`tradeSymbol ${tradeSymbol}`)
console.log(`senderNoteHash ${senderNoteHash}`)
console.log(`amount ${amount}`)
console.log(`Sender Index ${senderIndex}`)
console.log(`Receiver Index ${receiverIndex}`)
console.log(`Transferer Index ${transfererIndex}`)
console.log(`Transfer All ${transferAll}`)
console.log(`Cx Func Name ${cxName}`)

assert( senderNoteHash.length === 66, `senderNoteHash should be a 0x-prefixed SHA-3 hash.`)
assert( tradeSymbol.length >= 3, `tradeSymbol should be 3 characters or more.` )
assert( Number.isInteger(parseInt(amount)), `amount must be an integer` )

if (!senderNoteHash || !tradeSymbol) { console.log( `Usage: ${process.argv.slice(0,2)} [tradeSymbol] [0xsenderNoteHash] [amount]` ) }
const _cx = (cxName === 'cx') ? cx : ((cxName === 'proxy1') ? proxy1Cx : null)

_cx(Map({
  tradeSymbol       : tradeSymbol,
  senderAddress     : parsed[`TEST_ADDRESS_${senderIndex}`],
  senderPassword    : parsed[`TEST_PASSWORD_${senderIndex}`],
  senderPublicKey   : parsed[`TEST_PUBLIC_KEY_${senderIndex}`],
  senderNoteHash    : senderNoteHash,
  deployerAddress   : parsed[`TEST_ADDRESS_${transfererIndex}`],
  deployerPassword  : parsed[`TEST_PASSWORD_${transfererIndex}`],
  receiverAddress   : parsed[`TEST_ADDRESS_${receiverIndex}`],
  receiverPublicKey : parsed[`TEST_PUBLIC_KEY_${receiverIndex}`],
  transferAmount    : amount,
  transferAll       : transferAll,
  testValueETH      : '0.15',
  testAccountIndex  : 9,
  unlockSeconds     : 35,
})).then((result) => {
  console.log(result.get('receiverNoteHash'))
  console.log(result.get('changeNoteHash'))
  console.log(result.get('cxName'))
  console.log('Confidential transfer complete.')
  wallet.shutdownSync()
})
