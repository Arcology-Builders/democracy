// Confidential transfer of an amount from a sender to a receiver with change back.
'use strict'
const { Map }   = require('immutable')

const assert    = require('chai').assert

const { departTransform }
                = require('demo-depart')
const {
  createArgListTransform, deployerTransform, runTransforms,
} = require('demo-transform')

const { fromJS, Logger, getConfig }
                = require('demo-utils')
const { wallet, isAccount }
                = require('demo-keys')
const {
  cxPrepare, cxTransfer, cxFinish, getAztecPublicKey,
  createSignerTransform, createPublicKeyTransform,
} = require('demo-aztec-lib')

const LOGGER    = new Logger('proxy1Cx')

const m0 = createArgListTransform(Map({
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
const m1 = deployerTransform
const m2 = departTransform
const m3 = createSignerTransform()
const m4 = createPublicKeyTransform()

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

const proxy1Cx = async (state) => {
  return await runTransforms( OrderedMap([
    [ m0        , 'm0'         ],
    [ ms(state) , 'ms'         ],
    [ m1        , 'deployer'   ],
    [ m2        , 'depart'     ],
    [ m3        , 'signer'     ],
    [ m4        , 'publicKey'  ],
    [ m5        , 'proxy1'     ],
    [ cxPrepare , 'cxPrepare'  ],
    [ cxTransfer, 'cxTransfer' ],
    [ cxFinish  , 'cxFinish'   ],
    ] ) )
}

module.exports = {
  proxy1Cx
}
