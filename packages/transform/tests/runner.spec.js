'use strict'
const assert = require('chai').assert
const { runTransforms, createArgListTransform, deployerTransform } = require('../src/runner')
const { DEMO_TYPES } = require('../src/types')

const { immEqual, fromJS, getNetwork, Logger } = require('demo-utils')
const { wallet } = require('demo-keys')
const { Transform, TYPES, createTransform } = require('demo-state')
const { Map, List } = require('immutable')
const LOGGER = new Logger('tests/runner')

describe( 'Runners', () => {

  it( 'creates an arglist mixin', async () => {
  
    // Test reading default values for argList, with no argv's passed in
    const alm0 = await createArgListTransform(Map({
        'anotherThing': DEMO_TYPES.integer,
        'babaloo'     : TYPES.string,
    }))
    const out0 = await alm0(Map({
      'anotherThing': 2,
      'babaloo': 'eighteen'
    }))
    assert.equal( out0.get('anotherThing'), 2 )
    assert.equal( out0.get('babaloo'), 'eighteen' )

    // Test reading the argv's
    process.argv.push('--anotherThing', '3', '--babaloo', '0x1010')
    const out = await alm0(Map({
      'anotherThing': 2,
      'babaloo': 'eighteen'
    }))
    assert.equal( out.get('anotherThing'), 3 )
    assert.equal( out.get('babaloo'), '0x1010' )
  })

  it( 'create a simple pipeline', async () => {
  
    // Runs a function with mixins, depends on process.argv above
    const alm2 = await createArgListTransform(Map({
      'anteater': TYPES.string,
      'bugbear': DEMO_TYPES.any,
      'unlockSeconds': DEMO_TYPES.integer,
      'testAccountIndex': DEMO_TYPES.integer,
      'testValueETH': DEMO_TYPES.string,
    }))

    /*
      'anteater': 'c', 'bugbear': undefined,
      'unlockSeconds': 1, 'testAccountIndex': 0, 'testValueETH': '0.1'
     */
    const dm = deployerTransform
    const mainFunc = createTransform(new Transform(
      async ({ chainId, anteater }) => {
        assert.equal( chainId, '2222' )
        assert.equal( anteater, 'c' )
        return Map({
          chainId: '2222',
        })
      },
      Map({
        chainId  : TYPES.string,
        anteater : TYPES.string,
      }),
      Map({
        chainId  : TYPES.string,
      }),
    ))
    const result = await runTransforms(
      [alm2],
      Map({
        anteater: 'aiai',
        bugbear: false,
        unlockSeconds: 2,
        testAccountIndex: 5,
        testValueETH: '0.2',
      })
    ) 
  })  

  it( 'creates a deployer transform', async () => {
    const alm3 = createArgListTransform(Map({
      'unlockSeconds'    : DEMO_TYPES.integer,
      'testAccountIndex' : DEMO_TYPES.integer,
      'testValueETH'     : TYPES.string,
      'deployerAddress'  : DEMO_TYPES.ethereumAddress.opt,
      'deployerPassword' : DEMO_TYPES.string.opt,
    }))
    const dm = deployerTransform
    const out0 = await alm3(Map({
      unlockSeconds    : 1,
      testAccountIndex : 0,
      testValueETH     : '0.1',
      deployerAddress  : undefined,
      deployerPassword : undefined,
    }))
    const out1 = await dm(out0)
    assert.equal( out1.get('deployerAddress').length , 42 )
    assert.equal( out1.get('deployerPassword').length, 64 )
    const actualId = await out1.get('deployerEth').net_version()
    const expectedId = await getNetwork().net_version() 
    assert.equal( expectedId, actualId )
  })

  it( 'preserves deployer address and password in deployer mixin', async () => {
    const { address, password } = await wallet.createEncryptedAccount()
    const alm = await createArgListTransform(Map({
      'unlockSeconds'    : DEMO_TYPES.integer,
      'testAccountIndex' : DEMO_TYPES.integer,
      'testValueETH'     : TYPES.string,
      'deployerAddress'  : DEMO_TYPES.ethereumAddress.opt,
      'deployerPassword' : DEMO_TYPES.string.opt,
    }))
    const dm = deployerTransform
    const out1 = await alm(Map({
      'unlockSeconds'    : 1,
      'testAccountIndex' : 0,
      'testValueETH'     : '0.1',
      'deployerAddress'  : address,
      'deployerPassword' : password,
    }))
    assert.equal( out1.get('deployerAddress'), address )
    assert.equal( out1.get('deployerPassword'), password )
    const out = await dm(out1)
    assert.equal( out.get('deployerAddress'), address )
    assert.equal( out.get('deployerPassword'), password )
  })

  it( 'merges a parallel list of mixins', async () => {
    const siblingMixin = (keyPrefix, timeout) => { return createTransform( new Transform(
      async ({ lastKey }) => {
        const returnMap = {}
        returnMap[keyPrefix + 'Address'  ] = '0x123'
        returnMap[keyPrefix + 'Password' ] = '0x456'
        returnMap[keyPrefix + 'StartTime'] = Date.now()
        returnMap['lastKey'] = keyPrefix
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            returnMap[keyPrefix + 'EndTime'] = Date.now()
            resolve(Map(returnMap))
          }, timeout)
        })
      },
      Map({
        lastKey: TYPES.string,
      }),
      Map({ lastKey: TYPES.string })
        .set(keyPrefix + 'Address'  , TYPES.string)
        .set(keyPrefix + 'Password' , TYPES.string)
        .set(keyPrefix + 'StartTime', TYPES.number)
        .set(keyPrefix + 'EndTime'  , TYPES.number)
      ,
    ) )}

    const m2 = createTransform( new Transform(
      async ({ senderEndTime, receiverEndTime }) => {
        return Map({
          timeDiff: receiverEndTime - senderEndTime
        })
      },
      Map({
        senderEndTime   : TYPES.number,
        receiverEndTime : TYPES.number,
      }),
      Map({ timeDiff: TYPES.number }),
    ) )

    const m0 = siblingMixin('sender', 1000)
    const m1 = siblingMixin('receiver', 1500)
    const finalState = await runTransforms( [ [ m0, m1 ], m2 ], Map({ lastKey: 'lastKey' }) )

    assert.equal(finalState.get('senderAddress'), '0x123')
    assert.equal(finalState.get('receiverAddress'), '0x123')
    assert(finalState.has('lastKey'))
    assert(finalState.get('receiverEndTime')  - finalState.get('senderEndTime') < 700)
    assert.equal(finalState.get('timeDiff'), finalState.get('receiverEndTime')  - finalState.get('senderEndTime'))
    assert.equal(finalState.count(), 10)
  })
// Re-enable these tests when we support substate / map types in demo-state
/*
  it( 'merges substates deeply', async () => {
    const subMixin = (keyPrefix, timeout, subStateLabel) => {
      return createTransform(new Transform(
        async ({ lastKey }) => {
          const returnMap = {}
          returnMap[keyPrefix + 'Address'] = '0x123'
          returnMap[keyPrefix + 'Password'] = '0x456'
          returnMap[keyPrefix + 'StartTime'] = Date.now()
          returnMap['lastKey'] = keyPrefix
          let out
          if (subStateLabel) { 
            out = {}
            out[subStateLabel] = returnMap
          } else {
            out = returnMap
          }
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              returnMap[keyPrefix + 'EndTime'] = Date.now()
              resolve(fromJS(out))
            }, timeout)
          })
        },
        Map({
          lastKey: TYPES.string,
        }),
        Map({ lastKey: TYPES.string })
          .set(keyPrefix + 'Address'  , TYPES.string)
          .set(keyPrefix + 'Password' , TYPES.string)
          .set(keyPrefix + 'StartTime', TYPES.number)
          .set(keyPrefix + 'EndTime'  , TYPES.number)
        ,
      ))
    }

    const m2 = createTransform( new Transform(
        async ({ sub: { senderEndTime } , bass: { receiverEndTime } }) => {
          return Map({
            lastKey : 'no im the only one',
            timeDiff: receiverEndTime - senderEndTime
          })
        },
        Map({
          'sub': TYPES.map,
          'bass': TYPES.map,
        }),
       Map({ 
          'lastKey': TYPES.string,
          'timeDiff': TYPES.number,
       })
    ) )

    const m0 = subMixin('sender'   , 1000, 'sub')
    const m1 = subMixin('receiver' , 1500, 'bass')
    const m3 = subMixin('niece'    , 500 , 'sub')
    const m4 = subMixin('nephew'   , 700 , 'bass')

    const finalState = await runTransforms(
      [ [ m0, m1 ], [ m3, m4 ], m2 ],
      Map({
        lastKey: '',
        sub: Map({}),
        bass: Map({}),
      }) )

    const sub = finalState.get('sub')
    const bass = finalState.get('bass')

    assert.equal(sub.get('senderAddress')   , '0x123')
    assert.equal(sub.get('nieceAddress')    , '0x123')
    assert.equal(bass.get('receiverAddress'), '0x123')
    assert.equal(bass.get('nephewAddress')  , '0x123')
    assert.equal(bass.get('ommerAddress')   , '0x123')
    assert(finalState.has('lastKey'))
    assert(bass.get('receiverEndTime')  - sub.get('senderEndTime') < 700)
    assert.equal(finalState.get('timeDiff'), bass.get('receiverEndTime')  - sub.get('senderEndTime'))
    assert.equal( finalState.count(), 5 )
    assert.equal( finalState.get('survivor'), 'I am', `Main state initial key does not survive parallel substates` )
  }) 
*/
})

