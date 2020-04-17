'use strict'
// A departure for AZTEC

const { Map } = require('immutable')
const { AZTEC_TYPES: TYPES } = require('demo-aztec-lib')

const {
  constants,
  proofs: {
    JOIN_SPLIT_PROOF,
    MINT_PROOF,
    BILATERAL_SWAP_PROOF,
    DIVIDEND_PROOF,
    PRIVATE_RANGE_PROOF,
  } } = require('@aztec/dev-utils')

console.log('DEPART')

depart(Map({
  departName : Map({
    type  : TYPES.string,
    value : 'AZTEC Departure',
  }),
  testValueETH : Map({
    type  : TYPES.string,
    value : '0.2',
  }),
  testAccountIndex : Map({
    type : TYPES.integer,
    value : 6,
  }),
  unlockSeconds : Map({
    type: TYPES.integer,
    value: 500,
  }),
  sourcePathList: Map({
    type: TYPES.array,
    value: ['../../node_modules/@aztec/protocol/contracts', '../lib/contracts', 'contracts'],
  }),
}),
async ({deployed, minedTx}) => {
  const ACE = await deployed( 'ACE' )
  const as = await deployed( 'AdjustSupply' )
  const bs = await deployed( 'BilateralSwap' )
  const js = await deployed( 'JoinSplit' )
  const pr = await deployed( 'PrivateRange' )
  const dc = await deployed( 'DividendComputation' )
  LOGGER.debug( 'All validators deployed.' )

  await minedTx( ACE.setCommonReferenceString, [constants.CRS] )
  LOGGER.debug( 'Set common reference string' )
  
  await minedTx( ACE.setProof, [ MINT_PROOF, as.address ] )
  LOGGER.debug( `Set mint proof ${as.address}` )
  await minedTx( ACE.setProof, [ BILATERAL_SWAP_PROOF, bs.address ] )
  LOGGER.debug( `Set bilateral swap proof ${bs.address}` )
  await minedTx( ACE.setProof, [ JOIN_SPLIT_PROOF, js.address ] )
  LOGGER.debug( `Set join split proof ${js.address}` )
  await minedTx( ACE.setProof, [ PRIVATE_RANGE_PROOF, pr.address ] )
  LOGGER.debug( `Set private range proof ${pr.address}` )
  await minedTx( ACE.setProof, [ DIVIDEND_PROOF, dc.address ] )
  LOGGER.debug( `Set dividend proof ${dc.address}` )
})
