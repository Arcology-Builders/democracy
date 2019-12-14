// A linked trade, one with signatures connecting the two confidential transfers to each other
'use strict'
const { Map, List } = require('immutable')
const { assert }    = require('chai')
const { padLeft }   = require('web3-utils')

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

const LOGGER    = new Logger('lt')

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
  saleExpireTimeSeconds : TYPES.integer,
  bidExpireTimeSeconds  : TYPES.integer,
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
  saleExpireTimeSeconds : Math.round(Date.now() / 1000) + 1000,
  bidExpireTimeSeconds  : Math.round(Date.now() / 1000) + 1000,
  testValueETH        : '0.2',
  testAccountIndex    : 0,
  proxyContractName   : 'TradeValidator',
  proxySwapMethodName : 'linkedTransfer',
  sourcePathList      : ['../../node_modules/@aztec/protocol/contracts'],
  wallet,
})

const ltTvAddressTransform = createTransformFromMap({
  func: async ({
    deployed,
  }) => {
    const tv = await deployed('TradeValidator')
    const ace = await deployed('ACE')
    return Map({
      transfererAddress: tv.address,
      tv               : tv,
      ace              : ace,
    })
  },
  inputTypes: Map({
    deployed: TYPES['function'],
  }),
  outputTypes: Map({
    transfererAddress : TYPES.ethereumAddress,
    tv                : TYPES.contractInstance,
    ace               : TYPES.contractInstance,
  }),
})

const ltPrepareTransform = (() => {

  const eachInputType = makeMapType(Map({
    address           : TYPES.ethereumAddress,
    zkToken           : TYPES.contractInstance,
    transfererAddress : TYPES.ethereumAddress,
    jsProofOutputs    : TYPES.hexPrefixed,
    jsProofData       : TYPES.hexPrefixed,
    jsSignatures      : TYPES.hexPrefixed,
  }), 'ltPrepareInputMapType')

  const eachOutputType = makeMapType(Map({
    swapMethodParams  : TYPES.array,
  }), 'ltPrepareOutputMapType')

  const func = async ({
    sigR, sigS, sigV,
    bidder,
    seller,
    saleExpireBlockNumber,
    bidExpireBlockNumber,
  }) => {

    const sellerParamList = [
      seller.address,
      seller.zkToken.address,
      padLeft('0x' + saleExpireBlockNumber.toString('hex'), 64),
      seller.transfererAddress,
    ]
    const bidderParamList = [
      bidder.address,
      bidder.zkToken.address,
      padLeft('0x' + bidExpireBlockNumber.toString('hex'), 64),
      sigR,
      sigS,
      '0x' + Number(sigV).toString(16),
    ]
    const sellerParams = List(sellerParamList).reduce(
      (s, v) => s + ((v.startsWith('0x')) ? v.slice(2) : v), '0x' )
    const bidderParams = List(bidderParamList).reduce(
      (s, v) => s + ((v.startsWith('0x')) ? v.slice(2) : v), '0x' )

    LOGGER.debug('Seller Params', sellerParams)
    LOGGER.debug('Bidder Params', bidderParams)
    const proxySwapMethodParams = [
      sellerParams          , bidderParams           ,
      seller.jsProofOutputs , bidder.jsProofOutputs  ,
      seller.jsSignatures   , bidder.jsSignatures    ,
      seller.jsProofData    , bidder.jsProofData     ,
    ]

    assert.equal( seller.transfererAddress, bidder.transfererAddress,
      `Seller and bidder transferer addresses differ.` )

    return Map({
      proxySwapMethodParams,
      seller : Map({
        swapMethodParams : sellerParamList, // we return these for testing
      }),
      bidder : Map({
        swapMethodParams : bidderParamList, // we return these for testing
      }),
    })
  }

  const inputTypes = Map({
    sigR                  : TYPES.keccak256Hash,
    sigS                  : TYPES.keccak256Hash,
    sigV                  : TYPES.integer,
    bidder                : eachInputType,
    seller                : eachInputType,
    saleExpireBlockNumber : TYPES.bn,
    bidExpireBlockNumber  : TYPES.bn,
  })

  const outputTypes = Map({
    proxySwapMethodParams : TYPES.array,
    bidder                : eachOutputType,
    seller                : eachOutputType,
  })

  return createTransformFromMap({
    func       ,
    inputTypes ,
    outputTypes,
  })

})()

lts.ltEarlyLabeledTransforms =  [
  [ 'argList' , m0                ],
  [ 'deployer', deployerTransform ],
  [ 'depart'  , departTransform   ],
]

lts.ltPipeline = constructPtTransformOrderedMap([
  ...lts.ltEarlyLabeledTransforms,
  [ 'tvAddress', ltTvAddressTransform  ],
  [ 'ptPrep'   , ptPrepareTransform    ],
], [
  [ 'eip712'   , signTypedDataTransform ],
  [ 'ltPrep'   , ltPrepareTransform     ],
  [ 'swap'     , swapTransform          ],
])

lts.lt = async (state) => {
  return await runTransforms( lts.ltPipeline, lts.ltInitialState.merge(state) )
}

module.exports = lts
