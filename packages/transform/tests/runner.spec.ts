'use strict'
const BN = require('bn.js')
import * as Imm from 'immutable'
const { OrderedMap, Map: Map, List: List } = require('immutable')
import { assert, expect } from 'chai'

const chai = require('chai')
chai.use(require('chai-as-promised'))

import {
  runTransforms, assembleCallablePipeline, createArgListTransform, deployerTransform
} from '../src/runner'

import {
  TYPES, makeMapType, createTransformFromMap, CallableTransform,
  CallablePipeline
} from '..'

const { immEqual, fromJS, getNetwork, Logger } = require('demo-utils')
const { wallet } = require('demo-keys')
const LOGGER = new Logger('tests/runner')


describe( 'Runners', () => {

  const itList = [ {
    desc: 'creates an arglist transform',
    func: async () => {
  
      // Test reading default values for argList, with no argv's passed in
      const alm0 = await createArgListTransform(Map({
          'anotherThing': TYPES.integer,
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
    }
  }, {

    desc: 'arglist transform preserves substate map',
    func: async () => {
    
      for (let i in [0,1,2,3]) {
        process.argv.pop()
      }
      // Test reading default values for argList, with no argv's passed in
      const alm0 = await createArgListTransform(Map({
          'anotherThing': TYPES.integer,
          'babaloo'     : makeMapType(Map({
            'ceecee' : TYPES.bn,
            'doodoo' : TYPES.integer,
          }), 'argListMapType'),
      }))
      const out0 = await alm0(Map({
        'anotherThing': 2,
        'babaloo': Map({
          'ceecee' : new BN(22),
          'doodoo' : 11,
        }),
      }))
      assert.equal( out0.get('anotherThing'), 2 )
      assert( out0.get('babaloo').get('ceecee').eq(new BN(22)) )

    },
  }, {
    desc: 'create a simple pipeline',
    func: async () => {
    
      // Runs a function with mixins, depends on process.argv above
      const alm2 = await createArgListTransform(Map({
        'anteater'        : TYPES.string,
        'bugbear'         : TYPES.any,
        'unlockSeconds'   : TYPES.integer,
        'testAccountIndex': TYPES.integer,
        'testValueETH'    : TYPES.string,
      }))

      /*
        'anteater': 'c', 'bugbear': undefined,
        'unlockSeconds': 1, 'testAccountIndex': 0, 'testValueETH': '0.1'
       */
      const dm = deployerTransform
      const mainFunc = createTransformFromMap({
        func: async ({ chainId, anteater }: { chainId: string, anteater: string }) => {
          assert.equal( chainId, '2222' )
          assert.equal( anteater, 'c' )
          return Map({
            chainId: '2222',
          })
        },
        inputTypes: Map({
          chainId  : TYPES.string,
          anteater : TYPES.string,
        }),
        outputTypes: Map({
          chainId  : TYPES.string,
        }),
      })
      const result = await runTransforms(
        OrderedMap({'alm2':[alm2]}),
        Map({
          anteater: 'aiai',
          bugbear: false,
          unlockSeconds: 2,
          testAccountIndex: 5,
          testValueETH: '0.2',
        })
      ) 
    },
  }, {
    desc: 'creates a deployer transform',
    func: async () => {
      const alm3 = createArgListTransform(Map({
        'unlockSeconds'    : TYPES.integer,
        'testAccountIndex' : TYPES.integer,
        'testValueETH'     : TYPES.string,
        'deployerAddress'  : TYPES.ethereumAddress.opt,
        'deployerPassword' : TYPES.string.opt,
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
    },
  }, {
    desc: 'preserves deployer address and password in deployer mixin',
    func: async () => {
      const { address, password } = await wallet.createEncryptedAccount()
      const alm = await createArgListTransform(Map({
        'unlockSeconds'    : TYPES.integer,
        'testAccountIndex' : TYPES.integer,
        'testValueETH'     : TYPES.string,
        'deployerAddress'  : TYPES.ethereumAddress.opt,
        'deployerPassword' : TYPES.string.opt,
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
    },
  }, {
    desc: 'merges a parallel list of transforms',
    func: async () => {
      const siblingMixin = (keyPrefix: string, timeout: number) => createTransformFromMap({
        func: async ({ lastKey }: { lastKey: string }) => {
          const returnMap: { [key: string]: any } = {}
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
        inputTypes: Map({
          lastKey: TYPES.string,
        }),
        outputTypes: Map({ lastKey: TYPES.string })
          .set(keyPrefix + 'Address'  , TYPES.string)
          .set(keyPrefix + 'Password' , TYPES.string)
          .set(keyPrefix + 'StartTime', TYPES.number)
          .set(keyPrefix + 'EndTime'  , TYPES.number)
        ,
      })
      const m2: CallableTransform = createTransformFromMap({
        func: async ({ senderEndTime, receiverEndTime }: { senderEndTime: number, receiverEndTime: number }) => {
          return Map({
            timeDiff: receiverEndTime - senderEndTime
          })
        },
        inputTypes: Map({
          senderEndTime   : TYPES.number,
          receiverEndTime : TYPES.number,
        }),
        outputTypes: Map({ timeDiff: TYPES.number }),
      })
      
      assert( m2.transform.inputTypes, `${m2.transform} does not have inputTypes` )
      const m0 : CallableTransform = siblingMixin('sender', 1000)
      const m1 : CallableTransform = siblingMixin('receiver', 1500)
      const callablePipeline1: CallablePipeline = assembleCallablePipeline( fromJS([ [ m0, m1 ] ]) )

      assert( callablePipeline1.pipeline, `assembleCallablePipeline does not assemble` )

      const callablePipeline2: CallablePipeline = assembleCallablePipeline( OrderedMap({'m2': [ m2 ]}) )
      assert( callablePipeline2.pipeline, `assembleCallablePipeline does not assemble` )
      const initialState = Imm.Map({ lastKey: 'lastKey' })

      expect(
        callablePipeline2( Map({}) )
      ).to.be.rejectedWith(Error)

      const out = await m0(Imm.Map({ lastKey: 'last', senderEndTime: 123, receiverEndTime: 456}))
      assert( Imm.Map.isMap(out) )

      const finalState1 = await callablePipeline1( initialState )
      assert( Imm.Map.isMap(finalState1), `result of callablePipeline was not an Immutable Map` )
      
      const finalState2 = await callablePipeline2( finalState1 )

      const finalState = await runTransforms( fromJS([ [ m0, m1 ], m2 ]), initialState )
      assert( immEqual( List(finalState2.keys()), List(finalState.keys()) ),
             `Final state 2 ${JSON.stringify(finalState2.toJS())} different than final state ${JSON.stringify(finalState.toJS())}` )

      assert.equal(finalState.get('senderAddress'), '0x123')
      assert.equal(finalState.get('receiverAddress'), '0x123')
      assert(finalState.has('lastKey'))
      assert(finalState.get('receiverEndTime')  - finalState.get('senderEndTime') < 700)
      assert.equal(finalState.get('timeDiff'), finalState.get('receiverEndTime')  - finalState.get('senderEndTime'))
      assert.equal(finalState.count(), 10)

    },
  } ]
    
  it(itList[0].desc, itList[0].func)
  const result = itList.reduce(async (prom, {desc, func}) => {
    await prom
    //console.log(desc)
    it(desc, func)
    return prom 
  }, Promise.resolve(true))
})

