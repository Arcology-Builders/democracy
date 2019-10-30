'use strict'
import * as Imm from 'immutable'
const { Map: Map, List: List } = require('immutable')
import { assert } from 'chai'
import {
  runTransforms, assembleCallablePipeline, createArgListTransform, deployerTransform,
  ArgType, ArgTypes,
  TYPES, makeMapType, createTransformFromMap, CallableTransform, CallablePipeline
} from '..'

const { immEqual, fromJS, getNetwork, Logger } = require('demo-utils')
const { wallet } = require('demo-keys')
const LOGGER = new Logger('tests/runner')


describe( 'Transforms with substate labels', () => {

  // Re-enable these tests when we support substate / map types in demo-state
  it( 'merges substates deeply', async () => {
    const subMixin = (keyPrefix: string, timeout: number, subStateLabel: string) => {

      const REQUIRED_SUBTYPES : ArgTypes = Map({})
        .set(keyPrefix + 'Address'  , TYPES.string)
        .set(keyPrefix + 'Password' , TYPES.string)
        .set(keyPrefix + 'StartTime', TYPES.number)
        .set(keyPrefix + 'EndTime'  , TYPES.number)
      
      // Make all input types optional except lastKey
      const OPTIONAL_SUBTYPES : ArgTypes = REQUIRED_SUBTYPES.map(
        (v: ArgType, k: string) => (k === 'lastKey') ? v : v.opt
      )
      
      const REQUIRED_MAPTYPE1 = makeMapType(REQUIRED_SUBTYPES, 'mapType1')
      const OPTIONAL_MAPTYPE1 = REQUIRED_MAPTYPE1.opt


      const outputTypes : ArgTypes = (subStateLabel) ?
        Map({ [subStateLabel]: REQUIRED_MAPTYPE1 }) : REQUIRED_MAPTYPE1
      const inputTypes : ArgTypes = (subStateLabel) ?
        Map({ [subStateLabel]: OPTIONAL_MAPTYPE1 }) : OPTIONAL_MAPTYPE1
        
      return createTransformFromMap({
        func: async ({ lastKey, [subStateLabel] : subState }) => {
          const returnMap: { [key: string]: any } = {
            [keyPrefix + 'Address'  ]: '0x123' + (subState ? subState[keyPrefix + 'Address'] : '')   ,
            [keyPrefix + 'Password' ]: '0x456'   ,
            [keyPrefix + 'StartTime']: Date.now(),
          }
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              returnMap[keyPrefix + 'EndTime'] = Date.now()
              const returnImmMap = Imm.Map(returnMap)
              const subStateMap = (subStateLabel) ? Imm.Map({ [subStateLabel]: returnImmMap }) : returnImmMap
              resolve(subStateMap.set('lastKey', keyPrefix))
            }, timeout)
          })
        },
        inputTypes,
        outputTypes: outputTypes.set('lastKey', TYPES.string),
      })
    }

    const m0 = subMixin('sender'   , 1000, 'sub')
    const m1 = subMixin('receiver' , 1500, 'bass')
    const m3 = subMixin('sender'    , 500 , 'sub')
    const m4 = subMixin('receiver'   , 700 , 'bass')

    const m2 = createTransformFromMap({
      func: async ({ sub: { senderEndTime } , bass: { receiverEndTime }, survivor }) => {
          assert.equal( survivor, 'I am', `Survivor does not survive inside last transform.` )
          return Map({
            lastKey : 'no im the only one',
            timeDiff: receiverEndTime - senderEndTime
          })
        },
      inputTypes: Map({
          'survivor' : TYPES.string,
          'sub'      : m3.transform.outputTypes.get('sub'),
          'bass'     : m4.transform.outputTypes.get('bass'),
        }),
      outputTypes: Map({ 
          'lastKey'  : TYPES.string,
          'timeDiff' : TYPES.number,
       }),
    })

    const finalState = await runTransforms(
      fromJS([ [ m0, m1 ], [ m3, m4 ], m2 ]),
      Map({
        survivor: 'I am',
        //sub: Map({}),  // Leave these undefined to pass optional checks
        //bass: Map({}), // not empty Map
      }) )

    const sub = finalState.get('sub')
    const bass = finalState.get('bass')

    assert.equal(sub.get('senderAddress')   , '0x1230x123')
    assert.equal(bass.get('receiverAddress'), '0x1230x123')
    assert(finalState.has('lastKey'))
    assert(bass.get('receiverEndTime')  - sub.get('senderEndTime') < 700)
    assert.equal(finalState.get('timeDiff'), bass.get('receiverEndTime')  - sub.get('senderEndTime'))

    assert.equal( finalState.count(), 5 )
    assert.equal( finalState.get('survivor'), 'I am', `Main state initial key does not survive parallel substates` )
  }) 

})

