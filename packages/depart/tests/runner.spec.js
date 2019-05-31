'use strict'

const assert = require('chai').assert
const { run, argListMixin, deployerMixin } = require('../src/runner')

const { immEqual, getNetwork, Logger } = require('demo-utils')
const { Map } = require('immutable')
const LOGGER = new Logger('tests/runner')

describe( 'Runners', () => {

  it( 'creates an arglist mixin', async () => {
  
    // Test reading default values for argList, with no argv's passed in
    const alm0 = await argListMixin([['anotherThing', 2], ['babaloo', 'eighteen']])
    const out0 = await alm0(Promise.resolve(Map({})))
    assert( immEqual( out0, new Map({
      'anotherThing': 2, 'babaloo': 'eighteen'}) ),
      `Output state was ${out0}` )

    // Test reading the argv's
    process.argv.push('a', 'b')
    const alm = await argListMixin([['anotherThing', 2], ['babaloo', 'eighteen']])
    const out = await alm(Promise.resolve(Map({})))
    assert( immEqual( out, new Map({
      'anotherThing': 'a', 'babaloo': 'b', 'calisthenics': undefined}) ),
      `Output state was ${out}` )
  
    // Runs a function with mixins, depends on process.argv above
    const alm2 = await argListMixin([['anteater', undefined], ['bugbear', undefined]])
    const dm = await deployerMixin({ unlockSeconds: 1 })
    const mainFunc = async (finalStateProm) => {
      const finalState = await finalStateProm
      assert.equal( finalState.get('chainId'), '2222' )
      assert.equal( finalState.get('anteater'), 'a' )
    }
    await run( mainFunc, [ alm2, dm] ) 
  })  

  it( 'creates a deployer mixin', async () => {
    const dm = await deployerMixin({ unlockSeconds: 1 })
    const out = await dm(Promise.resolve(Map({})))
    LOGGER.debug('DM out', out)
    assert.equal( out.get('deployerAddress').length, 42 )
    assert.equal( out.get('deployerPassword').length, 64 )
    const actualId = await out.get('deployerEth').net_version()
    const expectedId = await getNetwork().net_version() 
    assert.equal( expectedId, actualId )
  })

})

