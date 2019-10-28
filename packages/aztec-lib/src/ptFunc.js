// Confidential transfer of an amount from a sender to a receiver with change back.
'use strict'
const { Map, OrderedMap }   = require('immutable')

const assert    = require('chai').assert

const { Logger } = require('demo-utils')
const { assembleCallablePipeline, createTransformFromMap, makeMapType, isTransform } = require('demo-transform')
const {
  createCxPrepareTransform, createCxFinishTransform, createCxTokenContractsTransform,
  cxJsContractTransform,
}               = require('./cxFunc')
const { createSignerTransform, createPublicKeyTransform } = require('./transforms')
const { AZTEC_TYPES: TYPES } = require('./utils')

const LOGGER    = new Logger('pt')

const ptFuncs = {}

const createPtPrepareTransform = () => {

  const eachOutputTypes = Map({
    tradeSymbol         : TYPES.string,
    senderAddress       : TYPES.ethereumAddress,
    senderPassword      : TYPES.string,
    senderPublicKey     : TYPES.aztecPublicKey,
    senderNoteHash      : TYPES.aztecNoteHash,
    transfererAddress   : TYPES.ethereumAddress,
    transferAll         : TYPES.boolean,
    receiverAddress     : TYPES.ethereumAddress,
    receiverPublicKey   : TYPES.aztecPublicKey,
  })

  const eachInputTypes = Map({
    tradeSymbol       : TYPES.string,
    address           : TYPES.ethereumAddress,
    password          : TYPES.string,
    publicKey         : TYPES.aztecPublicKey,
    noteHash          : TYPES.aztecNoteHash,
  })

  const inputTypes = Map({
    seller            : makeMapType('seller', eachInputTypes, 'ptPrepInputsMapType'),
    bidder            : makeMapType('bidder', eachInputTypes, 'ptPrepInputsMapType'),
    deployerAddress   : TYPES.ethereumAddress,
    deployed          : TYPES['function'],
    proxyContractName : TYPES.string          ,
  })

  const outputTypes = Map({
    proxy  : TYPES.contractInstance,
    seller : makeMapType('seller', eachOutputTypes, 'ptPrepOutputsMapType'),
    bidder : makeMapType('bidder', eachOutputTypes, 'ptPrepOutputsMapType'),
  })

  return createTransformFromMap({
    func: async ({
      bidder,
      seller,
      deployerAddress,
      deployed,
      proxyContractName,
    }) => {

      assert( bidder.noteHash, 'bidderNote hash is null' + JSON.stringify(bidder) )
      assert( seller.noteHash, 'sellerNoteHash is null' + JSON.stringify(seller) )
      const proxy = proxyContractName ? await deployed( proxyContractName ) : null
      const transfererAddress = proxy ? proxy.address : deployerAddress

      const bidderMap = Map({
        tradeSymbol : bidder.tradeSymbol,
        senderAddress     : bidder.address,
        senderPassword    : bidder.password,
        senderPublicKey   : bidder.publicKey,
        senderNoteHash    : bidder.noteHash,
        transfererAddress,
        transferAll       : true,
        receiverAddress   : seller.address,
        receiverPublicKey : seller.publicKey,
      })
      LOGGER.info('bidderMap', bidderMap)

      const sellerMap = Map({
        tradeSymbol         : seller.tradeSymbol,
        senderAddress       : seller.address,
        senderPassword      : seller.password,
        senderPublicKey     : seller.publicKey,
        senderNoteHash      : seller.noteHash,
        transfererAddress,
        transferAll         : true,
        receiverAddress     : bidder.address,
        receiverPublicKey   : bidder.publicKey,
      })
      LOGGER.info('sellerMap', sellerMap)

      return Map({
        proxy             : proxy,
      })
        .merge(Map({ 'seller' : sellerMap }))
        .merge(Map({ 'bidder' : bidderMap }))
    },
    inputTypes,
    outputTypes,
  })

}

// Create subStates for seller and buyer from common state
ptFuncs.ptPrepareTransform   = createPtPrepareTransform()

// Export all of these. The buyer-side ones are used for bids,
// and the seller side ones are used for acceptances.

ptFuncs.signerSeller         = createSignerTransform('seller')
ptFuncs.publicKeySeller      = createPublicKeyTransform('seller')
ptFuncs.signerBidder         = createSignerTransform('bidder')
ptFuncs.publicKeyBidder      = createPublicKeyTransform('bidder')

ptFuncs.tokenContractsSeller = createCxTokenContractsTransform('seller')
ptFuncs.tokenContractsBidder = createCxTokenContractsTransform('bidder')

// Maker / seller
ptFuncs.prepSeller           = createCxPrepareTransform('seller')
ptFuncs.prepBidder           = createCxPrepareTransform('bidder')

ptFuncs.swapTransform = (() => {
  const eachType = Map({
    zkToken           : TYPES.contractInstance,
    transfererAddress : TYPES.ethereumAddress,
    jsProofData       : TYPES.string,
    jsSignatures      : TYPES.string,
  })

  const inputTypes = Map({
    proxy               : TYPES.contractInstance,
    proxySwapMethodName : TYPES.string,
    seller : makeMapType('seller', eachType, 'ptSwapInputsMapType'),
    bidder : makeMapType('bidder', eachType, 'ptSwapInputsMapType'),
    minedTx             : TYPES['function'],
  })

  return createTransformFromMap({
    func: async ({
      proxy,
      proxySwapMethodName,
      seller,
      bidder,
      minedTx,
    }) => {
      LOGGER.debug('Seller', seller)
      LOGGER.debug('Buyer' , bidder)
      LOGGER.debug('Seller Token Address', seller.zkToken.address)
      LOGGER.debug('Buyer Token Address' , bidder.zkToken.address)
      LOGGER.debug('Swap Method Name'    , proxySwapMethodName)
      assert( proxySwapMethodName, 'Proxy swap method name' )
      let txReceipt = await minedTx(proxy[proxySwapMethodName],
        [ seller.zkToken.address, bidder.zkToken.address ,
          seller.jsProofData    , bidder.jsProofData     ,
          seller.jsSignatures   , bidder.jsSignatures    , ] )
      return Map({ ptTxHash : txReceipt['transactionHash'] })
    },
    inputTypes,
    outputTypes: Map({
      'ptTxHash': TYPES.ethereumTxHash,
    }),
  })
})()

// These should never be useful outside of private trading so we don't export
const finishSeller = createCxFinishTransform('seller')
const finishBidder = createCxFinishTransform('bidder')

/**
 * A pipeline creator for private trades,
 * (which can be substituted to be CLI or web versions),
 * including state conversion / preparation mixins,
 * following by parallel buyer and seller preparation transforms for signer / public key /
 * substate preparation, a list of transforms to operate on all the substates,
 * once all the above is prepared,
 * and final transforms to write out any states to persistent / remote storage.
 * Right now it is specific to join-splits and private-trades.
 *
 * @param initialTransformList {Array} of mixins to run at the beginning, in a serial fashion
 * @param doItTransformList {Array} a list of mixins to actually do the things
 */
ptFuncs.constructPtTransformOrderedMap = (initialTransforms, doItTransforms) => {
  return OrderedMap([
    ...initialTransforms,
    ['jsContract'    , cxJsContractTransform],
    ['tokenContracts', [ptFuncs.tokenContractsSeller, ptFuncs.tokenContractsBidder ]],
    ['signers'       , [ptFuncs.signerSeller        , ptFuncs.signerBidder         ]],
    ['publicKey'     , [ptFuncs.publicKeySeller     , ptFuncs.publicKeyBidder      ]],
    ['prep'          , [ptFuncs.prepSeller          , ptFuncs.prepBidder           ]],
    ...doItTransforms,
    ['finish'        , [finishSeller        , finishBidder                         ]],
  ])
}

module.exports = ptFuncs
