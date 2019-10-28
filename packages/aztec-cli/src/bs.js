// Confidential transfer of an amount from a sender to a receiver with change back.
'use strict'
const { Map }   = require('immutable')

const assert    = require('chai').assert

const { departMixin } = require('demo-depart')
const { run, argListMixin, deployerMixin } = require('demo-transform')
const { fromJS, Logger, getConfig }
                = require('demo-utils')
const { wallet, isAccount }
                = require('demo-keys')
const { swapMixin, prepSubStatesMixin, constructMixinPipelineBS,
  getAztecPublicKey, signerMixin, publicKeyMixin } = require('demo-aztec-lib')

const LOGGER    = new Logger('bs')

const initialState = Map({
  unlockSeconds     : 30,
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
  sourcePathList    : ['../../node_modules/@aztec/protocol/contracts'],
})

const bs = async (state) => {
  const pipeline = constructMixinPipelineBS(
    [
      argListMixin(initialState),
      deployerMixin(),
      departMixin(),
      async () => { return state },
      prepSubStatesMixin(),
    ],
    '',
  )
  return await run( pipeline )
}

module.exports = {
  bs
}
