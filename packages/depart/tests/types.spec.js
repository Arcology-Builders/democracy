'use strict'

const { Map }    = require('immutable')
const { assert } = require('chai')

const { isHexPrefixed, TYPES, subbedKey, createTransform } = require('demo-transform')
const { wallet } = require('demo-keys')
const { getConfig } = require('demo-utils')
const { runStandardTransforms } = require('./common')
const { departTransform } = require('../src/departure')

describe('Departure types', () => {

  const TEST_ADDRESS = getConfig()['DEPLOYER_ADDRESS']

  const mainTransform = createTransform({
    func: async ({ deployed }) => {
      const ds = await deployed( 'DifferentSender' )
      assert( TYPES.contractInstance(ds) )
      return Map({
        ds: ds
      })
    },
    inputTypes: Map({
      deployed: TYPES['function'],
    }),
    outputTypes: Map({
      ds: TYPES.contractInstance,
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
    assert( TYPES.contractInstance(result['ds']),
           'Contract instance is not detected as valid' )
    assert( TYPES.contractInstance(result)['error'],
           'Transform result is erroneously detected as a contract instance' )
  })

  it('has a departTransform', async () => {
    assert.equal( departTransform.transform.toString(), 'Transform', `departTransform is malformed` )
  })

  after(() => {
    wallet.shutdownSync()
  })

})
