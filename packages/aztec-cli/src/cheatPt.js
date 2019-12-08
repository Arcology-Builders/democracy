// Confidential transfer of an amount from a sender to a receiver with change back.
'use strict'
const { Map }   = require('immutable')

const assert    = require('chai').assert

const { parsed } = require('dotenv').config()

const { departMixin } = require('demo-depart')
const { run, argListMixin, deployerMixin } = require('demo-transform')
const { fromJS, Logger, getConfig }
                = require('demo-utils')
const { wallet, isAccount }
                = require('demo-keys')
const { swapMixin, prepSubStatesMixin, constructMixinPipeline,
  getAztecPublicKey, signerMixin, publicKeyMixin } = require('demo-aztec-lib')

const LOGGER    = new Logger('pt')

const initialState = Map({
  unlockSeconds     : 30,
  deployerAddress   : parsed['TEST_ADDRESS_1'],
  deployerPassword  : parsed['TEST_PASSWORD_1'],
  sellerTradeSymbol : 'AAA',
  sellerAddress     : '',
  sellerPassword    : '',
  sellerPublicKey   : '',
  sellerNoteHash    : '',
  buyerTradeSymbol  : 'BBB',
  buyerAddress      : '',
  buyerPassword     : '',
  buyerPublicKey    : '', 
  buyerNoteHash     : '',
  testValueETH      : '0.1',
  testAccountIndex  : 0,
  proxyContractName : 'SwapProxy',
  sourcePathList    : ['../../node_modules/@aztec/protocol/contracts'],
})

const cheatingSwap = async (state) => {
  const {
    minedTx, deployed, transfererAddress, proxy,
    sellerTradeSymbol, buyerTradeSymbol,
  } = state.toJS()
  const seller = state.get('seller')
  const buyer  = state.get('buyer')
  LOGGER.debug('Seller', seller)
  LOGGER.debug('Buyer' , buyer)
  LOGGER.debug('Seller Token Address', seller.get('zkToken').address)
  LOGGER.debug('Buyer Token Address' , buyer.get('zkToken').address)
  LOGGER.debug('Transferer Address'  , transfererAddress)
  LOGGER.debug('Assume we are an Adversary, either an authorized proxy contract,')
  LOGGER.debug('one of the buyers / sellers')

  const sellerToken = await deployed( 'ZkAssetTradeable',
    { deployID: `deploy${sellerTradeSymbol}`} )
  const buyerToken  = await deployed( 'ZkAssetTradeable',
    { deployID: `deploy${buyerTradeSymbol}` } )

  let txHash1 = await minedTx( sellerToken.confidentialTransfer,
    [seller.get('jsProofData'), seller.get('jsSignatures') ] )
  LOGGER.debug('We should never get here, cheating 1-sided transfer of seller to buyer')

  let txHash2 = await minedTx( buyerToken.confidentialTransfer,
    [buyer.get('jsProofData'), buyer.get('jsSignatures') ] )
  LOGGER.debug('We should never get here, cheating 1-sided transfer of buyer to seller')
  return Map({ txHash1, txHash2 })
}


const cheatPt = async (state) => {
  const pipeline = constructMixinPipeline(
    [
      argListMixin(initialState),
      deployerMixin(),
      departMixin(),
      async () => { return state },
    ],
    prepSubStatesMixin(),
    cheatingSwap,
  )
  return await run( pipeline )
}

module.exports = {
  cheatPt
}
