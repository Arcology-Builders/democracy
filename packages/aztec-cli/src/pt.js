// Confidential transfer of an amount from a sender to a receiver with change back.
'use strict'
const { Map }   = require('immutable')
const { assert } = require('chai')

const { departTransform } = require('demo-depart')
const { makeMapType, runTransforms, createArgListTransform, deployerTransform,
  isTransform,
} = require('demo-transform')
const { wallet } = require('demo-keys')
const { Logger } = require('demo-utils')
const { AZTEC_TYPES: TYPES, swapTransform, ptPrepareTransform, constructPtTransformOrderedMap,
} = require('demo-aztec-lib')

const LOGGER    = new Logger('pt')

const eachTypes = Map({
  address     : TYPES.ethereumAddress,
  password    : TYPES.string,
  publicKey   : TYPES.aztecPublicKey,
  noteHash    : TYPES.aztecNoteHash,
  tradeSymbol : TYPES.string,
})

const m0 = createArgListTransform(Map({
  unlockSeconds       : TYPES.integer,
  seller              : makeMapType(eachTypes, 'ptInputsMapType'),
  bidder              : makeMapType(eachTypes, 'ptInputsMapType'),
  testValueETH        : TYPES.string,
  testAccountIndex    : TYPES.integer,
  proxyContractName   : TYPES.string,
  proxySwapMethodName : TYPES.string,
  wallet              : TYPES.wallet,
  sourcePathList      : TYPES.array,
}))

const pts = {}

// Default values that we don't expect to be supplied by the client
pts.ptInitialState = Map({
  unlockSeconds       : 30,
  testValueETH        : '0.1',
  testAccountIndex    : 0,
  proxyContractName   : 'SwapProxy',
  proxySwapMethodName : 'twoSidedTransfer',
  sourcePathList      : ['../../node_modules/@aztec/protocol/contracts'],
  wallet,
})

pts.ptEarlyLabeledTransforms =  [
  [ 'argList' , m0 ],
  [ 'deployer', deployerTransform],
  [ 'depart'  , departTransform],
]

pts.ptPipeline = constructPtTransformOrderedMap([
  ...pts.ptEarlyLabeledTransforms,
  [ 'ptPrep'  , ptPrepareTransform ],
], [
  ['swapTransform', swapTransform],
])

pts.pt = async (state) => {
  return await runTransforms( pts.ptPipeline, pts.ptInitialState.merge(state) )
}

module.exports = pts
