#!/usr/bin/env node
'use strict'
const assert = require('chai').assert
const { status } = require('../src/status')
const { Map } = require('immutable')
const { parsed } = require('dotenv').config()
const { wallet } = require('demo-keys')

const tradeSymbol     = process.argv[2]
const noteHash        = process.argv[3]
const ownerIndex      = process.argv[4] || 4 
const transfererIndex = process.argv[5] || 4 
console.log(`tradeSymbol ${tradeSymbol}`)
console.log(`noteHash ${noteHash}`)
console.log(`Onwer Index ${ownerIndex}`)
console.log(`Transferer Index ${transfererIndex}`)

assert( noteHash.length === 66, `noteHash should be a 0x-prefixed SHA-3 hash.`)
assert( tradeSymbol.length >= 3, `tradeSymbol should be 3 characters or more.` )

if (!noteHash || !tradeSymbol) {
  console.log( `Usage: ${process.argv.slice(0,2)} <tradeSymbol> <0xnoteHash> [ownerIndex] [transfererIndex]` )
}

status(Map({
  tradeSymbol       : tradeSymbol,
  noteHash          : noteHash,
  ownerAddress      : parsed[`TEST_ADDRESS_${ownerIndex}`],
  deployerAddress   : parsed[`TEST_ADDRESS_${transfererIndex}`],
  deployerPassword  : parsed[`TEST_PASSWORD_${transfererIndex}`],
  unlockSeconds     : 35,
})).then((result) => {
  console.log(`status ${result.get('status').toString()}`)
  console.log(`createdOn ${result.get('createdOn').toString()}`)
  console.log(`destroyedOn ${result.get('destroyedOn')}`)
  console.log(`noteOwner ${result.get('noteOwner')}`)
  console.log('Status complete.')
  wallet.shutdownSync()
})
