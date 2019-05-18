'use strict'

const assert = require('chai').assert
const { run, argListMixin, deployerMixin } = require('../src/runner')

const { immEqual, getNetwork, Logger } = require('demo-utils')
const { Map } = require('immutable')
const LOGGER = new Logger('tests/runner')

describe( 'Runners', () => {

  it( 'creates an arglist mixin', async () => {
    process.argv.push('a', 'b')
    const alm = await argListMixin(['anotherThing', 'babaloo'])
    const out = await alm(Promise.resolve(Map({})))
    assert( immEqual( out, new Map({
      'anotherThing': 'a', 'babaloo': 'b', 'calisthenics': undefined}) ),
      `Output state was ${out}` )
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

  it( 'runs a function with mixins', async () => {
    const alm = await argListMixin(['anteater', 'bugbear'])
    const dm = await deployerMixin({ unlockSeconds: 1 })
    const mainFunc = async (finalStateProm) => {
      const finalState = await finalStateProm
      assert.equal( finalState.get('chainId'), '2222' )
      assert.equal( finalState.get('anteater'), 'a' )
    }
    const out = run( mainFunc, [ alm, dm] ) 
  })

})

