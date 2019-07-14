'use strict'
const BN      = require('bn.js')
const assert  = require('chai').assert
const { Map } = require('immutable')

depart(Map({
  departName        : 'Test Departure',
  sourcePathList    : ['contracts-new'],
  compileFlatten    : true,
  compileOutputFull : true,
}), async ({ deployed, minedTx }) => {
  const relink = await deployed( 'Relink' )
 
  //const instance = await relink.getInstance() 
  const txReceipt = await minedTx( relink.outward, [new BN(2224), true] )
  const a = (await relink.a())['0']
  assert( a.eq(new BN(2224)), `Returned public member is not the one we set.` ) 
 
  return 22
})
