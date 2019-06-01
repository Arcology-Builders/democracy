'use strict'
const BN = require('bn.js')
const assert = require('chai').assert

depart({
  departName       : 'Test Departure',
  testAccountIndex : 1,
  testValueETH     : '0.2',
  sourcePathList   : ['contracts-new'],
}, async ({ deployed, minedTx }) => {
  const relink = await deployed( 'Relink' )
 
  //const instance = await relink.getInstance() 
  const txReceipt = await minedTx( relink.outward, [new BN(2223)] )
  const a = (await relink.a())['0']
  assert( a.eq(new BN(2223)), `Returned public member is not the one we set.` ) 
 
  return 22
})
