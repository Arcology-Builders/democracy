#!/usr/bin/env node
'use strict'
const assert = require('chai').assert
const { pt } = require('../src/pt')
const { Map } = require('immutable')
const { parsed } = require('dotenv').config()
const { wallet } = require('demo-keys')

const sellerTradeSymbol = process.argv[2]
const sellerNoteHash    = process.argv[3]
const sellerIndex       = process.argv[4] || 4 
const buyerTradeSymbol  = process.argv[5]
const buyerNoteHash     = process.argv[6]
const buyerIndex        = process.argv[7] || 2 
const transfererIndex   = process.argv[8] || 4 

console.log(`Seller Trade Symbol ${sellerTradeSymbol}`)
console.log(`Seller Note Hash    ${sellerNoteHash}`)
console.log(`Buyer Trade Symbol  ${buyerTradeSymbol}`)
console.log(`Buyer Note Hash     ${buyerNoteHash}`)
console.log(`Seller Index        ${sellerIndex}`)
console.log(`Buyer Index         ${buyerIndex}`)
console.log(`Transferer Index    ${transfererIndex}`)

assert( sellerNoteHash.length === 66, `sellerNoteHash should be a 0x-prefixed SHA-3 hash.`)
assert( buyerNoteHash.length === 66 , `buyerNoteHash should be a 0x-prefixed SHA-3 hash.`)
assert( sellerTradeSymbol.length >= 3     , `tradeSymbol should be 3 characters or more.` )
assert( buyerTradeSymbol.length >= 3     , `tradeSymbol should be 3 characters or more.` )

if (!sellerNoteHash || !buyerNoteHash || !sellerTradeSymbol || !buyerTradeSymbol) {
  console.log( `Usage: ${process.argv.slice(0,2)} <sellerTradeSymbol> <0xsellerNoteHash> <buyerTradeSymbol> <0xbuyerNoteHash> <transfererIndex> <sellerIndex> <buyerIndex>` )
}

pt(Map({
  sellerTradeSymbol : sellerTradeSymbol,
  sellerAddress     : parsed[`TEST_ADDRESS_${sellerIndex}`],
  sellerPassword    : parsed[`TEST_PASSWORD_${sellerIndex}`],
  sellerPublicKey   : parsed[`TEST_PUBLIC_KEY_${sellerIndex}`],
  sellerNoteHash    : sellerNoteHash,
  deployerAddress   : parsed[`TEST_ADDRESS_${transfererIndex}`],
  deployerPassword  : parsed[`TEST_PASSWORD_${transfererIndex}`],
  buyerTradeSymbol  : buyerTradeSymbol,
  buyerAddress      : parsed[`TEST_ADDRESS_${buyerIndex}`],
  buyerPassword     : parsed[`TEST_PASSWORD_${buyerIndex}`],
  buyerPublicKey    : parsed[`TEST_PUBLIC_KEY_${buyerIndex}`],
  buyerNoteHash     : buyerNoteHash,
  testValueETH      : '0.15',
  testAccountIndex  : 9,
  unlockSeconds     : 35,
})).then((result) => {
  console.log(result.get('swapTxHash'))
  console.log(result.get('buyerOutputNoteHash'))
  console.log(result.get('sellerChangeNoteHash'))
  console.log(result.get('sellerOutputNoteHash'))
  console.log(result.get('buyerChangeNoteHash'))
  console.log(result.get('sellerJoinSplitValidate'))
  console.log(result.get('buyerJoinSplitValidate'))
  console.log('Confidential transfer complete.')
  wallet.shutdownSync()
})
