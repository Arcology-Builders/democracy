// Confidential transfer of an amount from a sender to a receiver with change back.
'use strict'
const { Map }   = require('immutable')

const assert    = require('chai').assert

const { run, argListMixin, deployerMixin, departMixin }
                = require('demo-depart')
const { fromJS, Logger, getConfig }
                = require('demo-utils')
const { wallet, isAccount }
                = require('demo-keys')
const { cxPrepareFuncMixin, cxTransferFunc, cxFinishFuncMixin } = require('./cxFunc')
const { getAztecPublicKey } = require('./utils')
const { signerMixin, publicKeyMixin } = require('./mixins')

const LOGGER    = new Logger('proxy1Cx')

const m0 = argListMixin(Map({
  unlockSeconds     : 80,
  senderAddress     : '',
  senderPassword    : '',
  senderPublicKey   : '',
  receiverAddress   : '',
  receiverPublicKey : '', 
  senderNoteHash    : '',
  transferAmount    : '',
  testValueETH      : '0.1',
  testAccountIndex  : 0,
  tradeSymbol       : 'III',
  sourcePathList    : ['../../node_modules/@aztec/protocol/contracts'],
}))
const m1 = deployerMixin()
const m2 = departMixin()
const m3 = signerMixin()
const m4 = publicKeyMixin()

// Set the transfer function for a direct (non-proxy) confidential transfer
const m5 = async (state) => {
  const { minedTx, deployed, deployerAddress } = state.toJS()
  const proxy = await deployed('SwapProxy')
  console.log('Proxy Address', proxy.address)
  return Map({
    transfererAddress : proxy.address,
    transferFunc      : async (token, proofData, signatures) => {
      return await minedTx( proxy.oneSidedTransfer, [token.address, proofData, signatures] )
    },
    cxName            : 'proxy1',
  })
}

// Custom mixin to insert state, until demo-depart@0.3.3
const ms = (state) => {
  return async () => {
    return state
  }   
}

const cxPrepare = cxPrepareFuncMixin()
const cxFinish = cxFinishFuncMixin()

const proxy1Cx = async (state) => {
  return await run( cxFinish,
    [ m0, ms(state), m1, m2, m3, m4, m5, cxPrepare, cxTransferFunc ] ) 
}

module.exports = {
  proxy1Cx
}
