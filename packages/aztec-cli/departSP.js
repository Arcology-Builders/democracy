'use strict'
// A departure for AZTEC

const { Map } = require('immutable')
const { AZTEC_TYPES: TYPES } = require('demo-aztec-lib')
const { Logger } = require('demo-utils')

const LOGGER = new Logger('departSP')

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
    value : 6,
  }),
  unlockSeconds : Map({
    type: TYPES.integer,
    value: 60,
  }),
  compileOutputFull : Map({
    type: TYPES.boolean,
    value: true,
  }),
  sourcePathList: Map({
    type: TYPES.array,
    value: ['../../node_modules/@aztec/protocol/contracts', '../lib/contracts', 'contracts'],
  }),
}),
async ({deployed, compile, link, minedTx, chainId }) => {
  assert( chainId, `No chainId passed to departure. You should fix this in demo-depart.` )
  const ACE = await deployed( 'ACE' )
  const pu = await deployed( 'ParamUtils' )
  await compile( 'TradeValidator', 'TradeValidator.sol' )
  await link( 'TradeValidator', 'link', Map({
    'ParamUtils'     : 'deploy',
  }) )
  const tv = await deployed( 'TradeValidator',
    { ctorArgList: new Map({ _chainId: chainId, _aceAddress: ACE.address }) })

  LOGGER.info( 'TradeValidator', tv.address )
  LOGGER.info( 'ParamUtils', pu.address )
  await compile( 'SwapProxy', 'SwapProxy.sol' )
  await link( 'SwapProxy', 'link', Map({
    'ParamUtils'     : 'deploy',
    'TradeValidator' : 'deploy',
  }) )
  const sp = await deployed( 'SwapProxy',
    { ctorArgList: new Map({ _aceAddress: ACE.address, _tvAddress: tv.address }) })


})
