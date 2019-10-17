'use strict'
const { Map } = require('immutable')
const { DEMO_TYPES: TYPES } = require('demo-transform')
const BN = require('bn.js')
const assert = require('chai').assert

depart(Map({
  departName        : Map({ type: TYPES.string , value: 'Test Departure'  }),
  sourcePathList    : Map({ type: TYPES.array  , value: ['contracts-new'] }),
  compileFlatten    : Map({ type: TYPES.boolean, value: true }),
  compileOutputFull : Map({ type: TYPES.boolean, value: true }),
}), async ({ deployed, minedTx }) => {
  const relink = await deployed( 'Relink' )
 
  //const instance = await relink.getInstance() 
  const txReceipt = await minedTx( relink.outward, [new BN(2223)] )
  const a = (await relink.a())['0']
  assert( a.eq(new BN(2223)), `Returned public member is not the one we set.` ) 
 
  return 22
})
