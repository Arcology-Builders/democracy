'use strict'

const { Map }    = require('immutable')
const { assert } = require('chai')

const { isHexPrefixed, DEMO_TYPES, subbedKey, createTransform } = require('demo-transform')
const { wallet } = require('demo-keys')
const { getConfig } = require('demo-utils')
const { runStandardTransforms } = require('./common')

describe('Departure types', () => {

  const TEST_ADDRESS = getConfig()['DEPLOYER_ADDRESS']

  const mainTransform = createTransform({
    func: async ({ deployed }) => {
      const ds = await deployed( 'DifferentSender' )
      assert( DEMO_TYPES.contractInstance(ds) )
      return Map({
        ds: ds
      })
    },
    inputTypes: Map({
      deployed: DEMO_TYPES['function'],
    }),
    outputTypes: Map({
      ds: DEMO_TYPES.contractInstance,
    }),
  })

  let result

  before(async () => {
    result = await runStandardTransforms(
      mainTransform,
      Map({
        unlockSeconds    : 10,
        testValueETH     : '0.01',
        testAccountIndex : 0,
        departName       : 'type.spec',
        autoConfig       : false,
        sourcePathList   : ['../../node_modules/demo-test-contracts/contracts'],
      })
    )
  })

  it('detects contract instances', async () => {
    assert( DEMO_TYPES.contractInstance(result['ds']),
           'Contract instance is not detected as valid' )
    assert.notOk( DEMO_TYPES.contractInstance(result),
           'Transform result is erroneously detected as a contract instance' )
  })

  after(() => {
    wallet.shutdownSync()
  })

})
