// A linked trade, one with signatures connecting the two confidential transfers to each other
'use strict'
const { Map }   = require('immutable')
const { assert } = require('chai')

const { departTransform } = require('demo-depart')
const { makeMapType, runTransforms, createArgListTransform, deployerTransform,
  isTransform, createTransformFromMap,
} = require('demo-transform')
const { wallet } = require('demo-keys')
const { Logger } = require('demo-utils')
const {
  AZTEC_TYPES: TYPES, swapTransform, ptPrepareTransform, constructPtTransformOrderedMap,
  signTypedDataTransform,
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

const lts = {}

// Default values that we don't expect to be supplied by the client
lts.ltInitialState = Map({
  unlockSeconds       : 30,
  testValueETH        : '0.1',
  testAccountIndex    : 0,
  proxyContractName   : 'SwapProxy',
  proxySwapMethodName : 'linkedTransfer',
  sourcePathList      : ['../../node_modules/@aztec/protocol/contracts'],
  wallet,
})

const ltPrepareTransform = createTransformFromMap({
  func: async ({
    sigR, sigS, sigV,
    bidder : {
      address  : bidderAddress,
      noteHash : bidderNoteHash,
    },
    seller : {
      noteHash : sellerNoteHash,
    },
  }) => {
    return Map({
      seller : {
        swapMethodParams : [ sellerNoteHash ],
      },
      bidder : {
        swapMethodParams : [ bidderAddress, bidderNoteHash, sigR, sigS, '0x' + Number(sigV).toString(16) ],
      },
    })
  },
  inputTypes : Map({
    sigR : TYPES.keccak256Hash,
    sigS : TYPES.keccak256Hash,
    sigV : TYPES.integer,
    bidder : makeMapType(Map({
      address : TYPES.ethereumAddress,
      noteHash : TYPES.aztecNoteHash,
    }), 'ltPrepareBidderInputMapType'),
    seller : makeMapType(Map({
      noteHash : TYPES.aztecNoteHash,
    }), 'ltPrepareSellerInputMapType'),
  }),
  outputTypes : Map({
    seller : makeMapType(Map({
      swapMethodParams : TYPES.array,
    }), 'ltPrepareSellerOutputMapType'),
    bidder : makeMapType(Map({
      swapMethodParams : TYPES.array,
    }), 'ltPrepareBidderOutputMapType'),
  }),
})

lts.ltEarlyLabeledTransforms =  [
  [ 'argList' , m0 ],
  [ 'deployer', deployerTransform],
  [ 'depart'  , departTransform],
]

lts.ltPipeline = constructPtTransformOrderedMap([
  ...lts.ltEarlyLabeledTransforms,
  [ 'ptPrep'  , ptPrepareTransform ],
], [
  [ 'eip712'  , signTypedDataTransform ],
  [ 'ltPrep'  , ltPrepareTransform ],
  ['swapTransform', swapTransform],
])

lts.lt = async (state) => {
  return await runTransforms( lts.ltPipeline, lts.ltInitialState.merge(state) )
}

module.exports = lts
