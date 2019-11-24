// Test of pipeline error reporting
'use strict'

const chai = require('chai')
const { expect } = chai
chai.use(require('chai-as-promised'))

import { runTransforms, createArgListTransform, deployerTransform,
  TYPES, createTransformFromMap } from 'demo-transform'
import { OrderedMap, Map } from 'immutable'

describe('Pipelines', () => {

  const m0 = createArgListTransform(Map({
    unlockSeconds    : TYPES.integer,
    testValueETH     : TYPES.floatString,
    testAccountIndex : TYPES.integer,
  }))
  
  it('reports input type mismatch', async () => {

    const mainFunc = createTransformFromMap({
      func: async ({ x : any }) => {
        return Map({})
      },
      inputTypes: Map({
        x : TYPES.integer,
      }),
      outputTypes: Map({
        y : TYPES.bn,
      }),
    })

    // This is a promise that we expected to be rejected
    const result = runTransforms( OrderedMap({
        'argList' : m0                ,
        'deployer': deployerTransform ,
        'main'    : mainFunc          ,
    }), Map({
        unlockSeconds    : 10   ,
        testValueETH     : '0.1',
        testAccountIndex : 0    ,
      })
    )

    expect( result ).to.be.rejectedWith(
      'Arg named x mismatched type integer with error string Arg undefined did not have type integer'
    )

  })

  it('reports ', async () => {

    const mainFunc = createTransformFromMap({
      func: async ({ x : any }) => {
        throw new Error('blammo')
      },
      inputTypes: Map({
        x : TYPES.integer,
      }),
      outputTypes: Map({
        y : TYPES.bn,
      }),
    })

    // This is a promise that we expected to be rejected
    const result = runTransforms( OrderedMap({
        'argList' : m0                ,
        'deployer': deployerTransform ,
        'main'    : mainFunc          ,
    }), Map({
        unlockSeconds    : 10   ,
        testValueETH     : '0.1',
        testAccountIndex : 0    ,
        x                : 22   ,
      })
    )

    expect( result ).to.be.rejectedWith(
      'Transform run error in pipe 2 (indexed from 0) named main.\nblammo'
    )

  })


})
