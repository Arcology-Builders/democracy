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
    await run( mainFunc, [ alm2, dm] ) 
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

  it( 'merges a parallel list of mixins', async () => {
    const siblingMixin = (keyPrefix, timeout) => {
      return async (state) => {
        const returnMap = {}
        returnMap[keyPrefix + 'Address'] = '0x123'
        returnMap[keyPrefix + 'Password'] = '0x456'
        returnMap[keyPrefix + 'StartTime'] = Date.now()
        returnMap['lastKey'] = keyPrefix
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            console.log('Inside ' + keyPrefix, Date.now())
            returnMap[keyPrefix + 'EndTime'] = Date.now()
            resolve(Map(returnMap))
          }, timeout)
        })
      }
    }
    const m0 = siblingMixin('sender', 1000)
    const m1 = siblingMixin('receiver', 1500)

    const finalState = await run( async (state) => { }, [ [ m0, m1 ] ] )

    assert.equal(finalState.get('senderAddress'), '0x123')
    assert.equal(finalState.get('receiverAddress'), '0x123')
    assert(finalState.has('lastKey'))
    assert(finalState.get('receiverEndTime')  - finalState.get('senderEndTime') < 700)
    assert.equal(finalState.count(), 9)
  })

})

