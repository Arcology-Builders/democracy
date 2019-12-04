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
const signerTransform    = createSignerTransform()
const publicKeyTransform = createPublicKeyTransform()

const initialState = Map({
  unlockSeconds     : 1000,
  testValueETH      : '0.1',
  testAccountIndex  : 0,
  wallet            : wallet,
  sourcePathList    : ['../../node_modules/@aztec/protocol/contracts'],
})

// Set the transfer function for a direct (non-proxy) confidential transfer
const createCxTransferParams = (subStateLabel='unlabeled') => createTransformFromMap({
  func: async ({ minedTx, deployerAddress }) => {
    return Map({
      [subStateLabel]: Map({
        transfererAddress : deployerAddress,
        transferFunc      : async (token, proofData, signatures) => {
          return await minedTx( token.confidentialTransfer, [proofData, signatures] )
        }
      }),
    })
  },
  inputTypes: Map({
    minedTx         : TYPES['function'],
    deployerAddress : TYPES.ethereumAddress,
  }),
  outputTypes: Map({
    [subStateLabel] : makeMapType(Map({
      transfererAddress : TYPES.ethereumAddress,
      transferFunc      : TYPES['function'],
    }), 'cxTransferParamsMapType'),
  })
})

const cxTransferParams = createCxTransferParams()

const cxPrepare        = createCxPrepareTransform()
const cxTransfer       = createCxTransferTransform()
const cxFinish         = createCxFinishTransform()

const cxTokenContracts = createCxTokenContractsTransform()

const constructValidatePipeline = () => OrderedMap([
  ['argList'          , m0                    ],
  ['deployer'         , deployerTransform     ],
  ['depart'           , departTransform       ],
  ['signer'           , signerTransform       ],
  ['publicKey'        , publicKeyTransform    ],
  ['cxTransferParams' , cxTransferParams      ],
  ['cxJsContract'     , cxJsContractTransform ],
  ['cxTokenContracts' , cxTokenContracts      ],
  ['cxPrepare'        , cxPrepare             ],
])

const cxs = {}

cxs.constructCxPipeline = () =>
  constructValidatePipeline().merge(OrderedMap([
    [ 'cxTransfer' , cxTransfer ],
    [ 'cxFinish'   , cxFinish   ],
  ]))

cxs.preCx = async (state) => {
  return await runTransforms( constructValidatePipeline(), initialState.merge(state) )
}

cxs.cxPipeline = cxs.constructCxPipeline()

cxs.cx = async (state) => {
  return await runTransforms( cxs.cxPipeline, initialState.merge(state) )
}

module.exports = cxs
