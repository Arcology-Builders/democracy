'use strict'
// A departure for AZTEC

const { Map } = require('immutable')
const { AZTEC_TYPES: TYPES } = require('demo-aztec-lib')
const { Logger } = require('demo-utils')
const { assert } = require('chai')

const { toChecksumAddress } = require('ethereumjs-util')
const LOGGER = new Logger('departSP')

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
  LOGGER.info( 'ParamUtils', pu.address )

  await compile( 'TradeUtils', 'TradeUtils.sol' )
  await link( 'TradeUtils', 'link', Map({
    'ParamUtils' : 'deploy',
  }) )
  const tu = await deployed( 'TradeUtils' )
  LOGGER.info( 'TradeUtils', tu.address )

  // SwapProxy for one-sided and two-sided unlinked tr
  await compile( 'SwapProxy', 'SwapProxy.sol' )
  await link( 'SwapProxy', 'link', Map({
    'ParamUtils' : 'deploy',
    'TradeUtils' : 'deploy',
  }) )
  await deployed( 'SwapProxy',
    {
      ctorArgList: new Map({
        _aceAddress : ACE.address,
      }),
    }
  )

  // TradeValidator for linked trades
  await compile( 'TradeValidator', 'TradeValidator.sol' )
  await link( 'TradeValidator', 'link', Map({
    'ParamUtils'     : 'deploy',
    'TradeUtils'     : 'deploy',
  }))
  await deployed( 'TradeValidator',
    {
      ctorArgList: new Map({
        _chainId    : chainId,
        _aceAddress : ACE.address,
      }),
    }
  )

})
