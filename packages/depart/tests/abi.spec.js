'use strict'
const { Map }   = require('immutable')
const assert    = require('chai').assert
const { toWei } = require('web3-utils')
const BN        = require('bn.js')

const utils = require('demo-utils') 
const { DB_DIR, COMPILES_DIR, LINKS_DIR, DEPLOYS_DIR, getNetwork, immEqual, Logger } = utils
const LOGGER = new Logger('abi.spec')

const { wallet } = require('demo-keys')
const { run, argListMixin, deployerMixin, departMixin } = require('..')

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
  const m2 = departMixin()

  it( 'departs with a shadowed ABI', async () => { 
    const departFunc = async (state) => {
      const { deployed, minedTx, deployerAddress } = state.toJS()

      // The new way of compiling: deployed and minedTx
      const shadowInterface = await deployed( 'ShadowInterface' )
      const shadow = await deployed( 'Shadow', { abi: shadowInterface.abi } )
      const result = await shadow.doTheThing(new BN(1234), deployerAddress, new BN(5678),
                                             { from: deployerAddress, gas: 100000 } )
      //await minedTx( shadow.doTheThing, [new BN(1234), deployerAddress, new BN(5678)] )
      return new Map({ 'result': result['0'] })
    }

    finalState = (await run( departFunc, [ m0, m1, m2 ] )).toJS()
    const result = finalState['result']
    assert(result.eq(new BN(1234)), `Result ${result.toString()} was not hex for 1234`)
    return finalState
  })

  after(() => {
    wallet.shutdownSync()
  })
})
