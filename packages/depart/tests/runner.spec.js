'use strict'

const assert = require('chai').assert
const { run, argListMixin, deployerMixin } = require('../src/runner')

const { immEqual, getNetwork, Logger } = require('demo-utils')
const { wallet } = require('demo-keys')
const { Map } = require('immutable')
const LOGGER = new Logger('tests/runner')

describe( 'Runners', () => {

  it( 'creates an arglist mixin', async () => {
  
    // Test reading default values for argList, with no argv's passed in
    const alm0 = await argListMixin(Map({'anotherThing': 2, 'babaloo': 'eighteen'}))
    const out0 = await alm0(Promise.resolve(Map({})))
    assert.equal( out0.get('anotherThing'), 2 )
    assert.equal( out0.get('babaloo'), 'eighteen' )

    // Test reading the argv's
    process.argv.push('--anotherThing', 'a', '--babaloo', '0x1010')
    const alm = await argListMixin(Map({'anotherThing': 2, 'babaloo': 'eighteen'}))
    const out = await alm(Promise.resolve(Map({})))
    assert.equal( out.get('anotherThing'), 'a' )
    assert.equal( out.get('babaloo'), '0x1010' )
  
    // Runs a function with mixins, depends on process.argv above
    const alm2 = await argListMixin(Map({
      'anteater': 'c', 'bugbear': undefined,
      'unlockSeconds': 1, 'testAccountIndex': 0, 'testValueETH': '0.1'
    }))
    const dm = await deployerMixin()
    const mainFunc = async (finalStateProm) => {
      const finalState = await finalStateProm
      assert.equal( finalState.get('chainId'), '2222' )
      assert.equal( finalState.get('anteater'), 'c' )
    }
    await run( alm2, dm, mainFunc ) 
  })  

  it( 'creates a deployer mixin', async () => {
    const alm3 = await argListMixin(Map({
      'unlockSeconds': 1, 'testAccountIndex': 0, 'testValueETH': '0.1'
    }))
    const dm = await deployerMixin()
    const out = await dm(await alm3())
    assert.equal( out.get('deployerAddress').length, 42 )
    assert.equal( out.get('deployerPassword').length, 64 )
    const actualId = await out.get('deployerEth').net_version()
    const expectedId = await getNetwork().net_version() 
    assert.equal( expectedId, actualId )
  })

  it( 'preserves deployer address and password in deployer mixin', async () => {
    const { address, password } = await wallet.createEncryptedAccount()
    const alm = await argListMixin(Map({
      'unlockSeconds': 1, 'testAccountIndex': 0, 'testValueETH': '0.1',
      'deployerAddress': address, 'deployerPassword': password,
    }))
    const dm = await deployerMixin()
    const out1 = await alm()
    assert.equal( out1.get('deployerAddress'), address )
    assert.equal( out1.get('deployerPassword'), password )
    const out = await dm(out1)
    assert.equal( out.get('deployerAddress'), address )
    assert.equal( out.get('deployerPassword'), password )
  })

})

