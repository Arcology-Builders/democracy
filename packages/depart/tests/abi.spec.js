'use strict'
const { List, Map } = require('immutable')
const assert        = require('chai').assert
const { toWei }     = require('ethjs-unit')
const BN            = require('bn.js')

const utils = require('demo-utils') 
const { DB_DIR, COMPILES_DIR, LINKS_DIR, DEPLOYS_DIR, getNetwork, immEqual, Logger, toJS }
            = utils
const LOGGER = new Logger('abi.spec')

const { wallet } = require('demo-keys')
const { getMethodCallData, createRawTx, sendSignedTx } = require('demo-tx')
const { fromJS } = require('demo-utils')
const { run, argListMixin, bmMixin, compileMixin, deployerMixin, departMixin } = require('..')
const { createCompiler } = require('demo-compile')

describe( 'ABI swap', () => {
  
  let finalState

  const m0 = argListMixin(Map({
    unlockSeconds     : 50,
    testValueETH      : '0.05',
    testAccountIndex  : 0,
    departName        : "shadow",
    autoConfig        : true,
    sourcePathList    : ["contracts-new"],
  }))
  const m1 = deployerMixin()
  const m2 = bmMixin()
  const m3 = compileMixin(createCompiler)
  const m4 = departMixin()

  it( 'departs with a shadowed ABI', async () => { 
    const departFunc = async (state) => {
      const { compile, link, deployed, minedTx, deployerAddress, deployerEth } = state.toJS()

      // The new way of compiling: deployed and minedTx
      await compile( 'ShadowInterface', 'ShadowInterface.sol' )
      await compile( 'Shadow', 'Shadow.sol' )
      const shadowInterface = await link( 'ShadowInterface', 'link' ) //deployed( 'ShadowInterface' )
      assert( List.isList(shadowInterface.get('abi')), 'ABI should be a Map')
      const shadow = await deployed( 'Shadow', { abi: shadowInterface.get('abi') } )
      /*
      const args = List([new BN(1234), deployerAddress, new BN(5678)])
      const txData = await getMethodCallData(fromJS( shadowInterface.abi ), 'doTheThing', args)
      assert( List.isList(fromJS( shadowInterface.abi )), `ABI is not an Immutable List` )
      const rawTx = await createRawTx({ from: deployerAddress, data: txData })
      LOGGER.info('rawTxi', rawTx)
     */
      const result = await shadow.doTheThing(new BN(1234), deployerAddress, new BN(5678),
                                             { from: deployerAddress, gas: '100000' } )
/*
      const result = await sendSignedTx({ rawTx, signerEth: deployerEth })
      */
      //await minedTx( shadow.doTheThing, [new BN(1234), deployerAddress, new BN(5678)] )
      return new Map({ 'result': result['0'] })
    }

    finalState = (await run( m0, m1, m2, m3, m4, departFunc )).toJS()
    const result = finalState['result']
    assert(result.eq(new BN(1234)), `Result ${result.toString()} was not hex for 1234`)
    return finalState
  })

  after(() => {
    wallet.shutdownSync()
  })
})
