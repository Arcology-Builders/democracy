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
    value : 0,
  }),
  unlockSeconds : Map({
    type: TYPES.integer,
    value: 50,
  }),
  sourcePathList: Map({
    type: TYPES.array,
    value: ['../../node_modules/@aztec/protocol/contracts', '../lib/contracts', 'contracts'],
  }),
}),
async ({deployed, minedTx}) => {
  const ACE = await deployed( 'ACE' )
  const sp = await deployed( 'SwapProxy',
    { ctorArgList: new Map({ _aceAddress: ACE.address }) })

})
