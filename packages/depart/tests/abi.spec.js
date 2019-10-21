'use strict'
const { Map }    = require('immutable')
const assert     = require('chai').assert
const { toWei }  = require('web3-utils')
const BN         = require('bn.js')

const {
  DB_DIR, COMPILES_DIR, LINKS_DIR, DEPLOYS_DIR, getNetwork, immEqual, Logger
}                = require('demo-utils')
const LOGGER     = new Logger('abi.spec')

const { wallet } = require('demo-keys')
const {
  runTransforms, createArgListTransform, deployerTransform, DEMO_TYPES: TYPES,
  createTransform,
}                = require('demo-transform')
const { departTransform }
                 = require('..')

describe( 'ABI swap', () => {
  
  let finalState

  let m0
  const m1 = deployerTransform
  const m2 = departTransform

  before(async () => {
    m0 = await createArgListTransform(Map({
      unlockSeconds     : TYPES.integer,
      testValueETH      : TYPES.string,
      testAccountIndex  : TYPES.integer,
      departName        : TYPES.string,
      autoConfig        : TYPES.boolean.opt, 
      sourcePathList    : TYPES.array,
    }))
  })

  it( 'departs with a shadowed ABI', async () => { 
    const departFunc = createTransform({
      func: async ({ deployed, minedTx, deployerAddress }) => {
        LOGGER.debug(`DEPLOYER ADDRESS ${deployerAddress}`)

        // The new way of compiling: deployed and minedTx
        const shadowInterface = await deployed( 'ShadowInterface' )
        const shadow = await deployed( 'Shadow', { abi: shadowInterface.abi } )
        const result = await shadow.doTheThing(new BN(1234), deployerAddress, new BN(5678),
                                               { from: deployerAddress, gas: 100000 } )
        //await minedTx( shadow.doTheThing, [new BN(1234), deployerAddress, new BN(5678)] )
        return new Map({ 'result': result['0'] })
      },
      inputTypes: Map({
        deployed: TYPES['function'],
        minedTx: TYPES['function'],
        deployerAddress: TYPES.ethereumAddress,
      }),
      outputTypes: Map({
        result: TYPES.bn,
      })
    })

    finalState = await runTransforms( [ m0, m1, m2, departFunc ],
      Map({
        unlockSeconds     : 10,
        testValueETH      : '0.05',
        testAccountIndex  : 0,
        departName        : "shadow",
        autoConfig        : true,
        sourcePathList    : ["contracts-new"],
      })
    )
    const result = finalState.get('result')
    assert(result.eq(new BN(1234)), `Result ${result.toString()} was not hex for 1234`)
  })

  after(() => {
    wallet.shutdownSync()
  })
})
