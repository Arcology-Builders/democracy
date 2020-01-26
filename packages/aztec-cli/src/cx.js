// Confidential transfer of an amount from a sender to a receiver with change back.
'use strict'

const { Map, List, OrderedMap } = require('immutable')
const BN            = require('bn.js')
const assert        = require('chai').assert

const {
  runTransforms, createArgListTransform, deployerTransform, createTransformFromMap,
  makeMapType
}                   = require('demo-transform')
const { departTransform }
                = require('demo-depart')
const { fromJS, Logger, getConfig }
                = require('demo-utils')
const { wallet, isAccount }
                = require('demo-keys')
const {
  constructCxPipeline,
  createCxPrepareTransform, createCxTransferTransform, createCxFinishTransform,
  cxJsContractTransform, createCxTokenContractsTransform,
  createSignerTransform, createPublicKeyTransform,
  getAztecPublicKey, AZTEC_TYPES: TYPES,
}               = require('demo-aztec-lib')

const LOGGER    = new Logger('cx')

const m0 = createArgListTransform(Map({
  unlockSeconds     : TYPES.integer,
  unlabeled         : makeMapType(Map({
    senderAddress     : TYPES.ethereumAddress,
    senderPassword    : TYPES.string,
    senderPublicKey   : TYPES.aztecPublicKey,
    receiverAddress   : TYPES.ethereumAddress,
    receiverPublicKey : TYPES.aztecPublicKey,
    senderNoteHash    : TYPES.aztecNoteHash,
    transferAmount    : TYPES.bn.opt,
    transferAll       : TYPES.boolean.opt,
    tradeSymbol       : TYPES.string,
  }), 'cxInputsMapType'),
  testValueETH      : TYPES.string,
  testAccountIndex  : TYPES.integer,
  wallet            : TYPES.wallet,
  sourcePathList    : TYPES.array,
}))

const initialState = Map({
  unlockSeconds     : 1000,
  testValueETH      : '0.1',
  testAccountIndex  : 0,
  wallet            : wallet,
  sourcePathList    : ['../../node_modules/@aztec/protocol/contracts'],
})

const earlyTransforms = OrderedMap([
    ['argList'          , m0                    ],
    ['deployer'         , deployerTransform     ],
    ['depart'           , departTransform       ],
])

const cxs = {}

cxs.preCx = async (state) => {
  return await runTransforms( constructCxPipeline(earlyTransforms), initialState.merge(state) )
}

cxs.cxPipeline = constructCxPipeline(earlyTransforms)

cxs.cx = async (state) => {
  return await runTransforms( cxs.cxPipeline, initialState.merge(state) )
}

module.exports = cxs
