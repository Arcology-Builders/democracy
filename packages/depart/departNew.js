'use strict'
const { Map } = require('immutable')
const { DEMO_TYPES: TYPES } = require('demo-transform')
const BN = require('bn.js')
const assert = require('chai').assert

depart(Map({
  someSymbol        : Map({ type: TYPES.string , value: 'a mirage'  }),
  departName        : Map({ type: TYPES.string , value: 'Test Departure'  }),
  sourcePathList    : Map({ type: TYPES.array  , value: ['contracts-new'] }),
  compileFlatten    : Map({ type: TYPES.boolean, value: true }),
  compileOutputFull : Map({ type: TYPES.boolean, value: true }),
}), async ({ deployed, minedTx, someSymbol }) => {
  
  assert.equal( someSymbol, 'a mirage', `someSymbol did not make it through to departFunc` )
  const relink = await deployed( 'Relink' )
 
  //const instance = await relink.getInstance() 
  const txReceipt = await minedTx( relink.outward, [new BN(2223)] )
  const a = (await relink.a())['0']
  assert( a.eq(new BN(2223)), `Returned public member is not the one we set.` ) 
 
  return 22
})
