// Confidential transfer of an amount from a sender to a receiver with change back.
'use strict'
const { Map }   = require('immutable')

const assert    = require('chai').assert

const {
    proofs: {
        BILATERAL_SWAP_PROOF,
    },
} = require('@aztec/dev-utils')

const { proof } = require('aztec.js')
const { fromJS, Logger, getConfig }
                = require('demo-utils')
const { wallet, isAccount }
                = require('demo-keys')
const { prepSubStatesMixin, constructMixinPipeline } = require('./ptFunc')
const { cxPrepareFuncMixin, cxFinishFuncMixin } = require('./cxFunc')
const { getAztecPublicKey } = require('./utils')
const { signerMixin, publicKeyMixin }
                 = require('./mixins')

const LOGGER    = new Logger('pt')

const bsFuncs = {}

const mSignerSeller    = signerMixin('seller')
const mPublicKeySeller = publicKeyMixin('seller')
const mSignerBuyer     = signerMixin('buyer')
const mPublicKeyBuyer  = publicKeyMixin('buyer')

// Maker / seller
const mPrepSeller      = cxPrepareFuncMixin('seller')
const mPrepBuyer       = cxPrepareFuncMixin('buyer')

const swapMixin = () => {
  return async (state) => {
    const { minedTx, deployed, transfererAddress } = state.toJS()
    const seller = state.get('seller')
    const buyer  = state.get('buyer')
    LOGGER.debug(`Seller`, seller)
    LOGGER.debug(`Buyer` , buyer)
    LOGGER.debug(`Seller Token Address`, seller.get('zkToken').address)
    LOGGER.debug(`Buyer Token Address` , buyer.get('zkToken').address)
    LOGGER.debug(`Transferer Address`  , transfererAddress)
    const ace = await deployed( 'ACE' )
    
    const bsProof = await proof.bilateralSwap.encodeBilateralSwapTransaction({
      inputNotes    : [ seller.get('jsSenderNote'), buyer.get('jsSenderNote') ],
      outputNotes   : [ seller.get('jsReceiverNote'), buyer.get('jsReceiverNote') ],
      senderAddress : transfererAddress,
    })
   
   // Uncomment this and run to dump out a hardcoded bsProof for unit testing in
    // {lib} without minting new notes
    //console.log('bsProof', JSON.stringify(bsProof))
    //console.log('transfererAddress', transfererAddress)
    //console.log('BILATERAL_SWAP_PROOF', BILATERAL_SWAP_PROOF)

    const receipt = await minedTx( ace.validateProof, [BILATERAL_SWAP_PROOF, transfererAddress, bsProof.proofData] )
    console.log('reciept', JSON.stringify(receipt))
    assert( receipt.status, `Receipt status is not true` )
   
   // It's not clear how to actually execute the BILATERAL_SWAP 
    //const txHash = await minedTx( ace.updateNoteRegistry, [BILATERAL_SWAP_PROOF, bsProof.proofData, transfererAddress] )

    return Map({ receipt })
  }
}

const mFinishSeller = cxFinishFuncMixin('seller')
const mFinishBuyer  = cxFinishFuncMixin('buyer')

/**
 * Construct a pipeline for bilateral swaps
 * @param initialMixinList {Array} list of initial mixins like deployer and argListMixin
 * @param contractName {String} optional contractName of swap proxy, if null
 *   the transfererAddress is deployerAddress
 */
bsFuncs.constructMixinPipelineBS = (initialMixinList, contractName) => {
  const preamble = [ ...initialMixinList, prepSubStatesMixin(contractName) ]
  return constructMixinPipeline(preamble, [swapMixin()])
}

module.exports = bsFuncs
