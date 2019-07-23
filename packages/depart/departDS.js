'use strict'
const BN        = require('bn.js')
const assert    = require('chai').assert
const { Map }   = require('immutable')
const { toWei } = require('web3-utils')

depart(Map({
  departName        : 'Test Departure',
  sourcePathList    : ['../test-contracts/contracts'],
  compileFlatten    : true,
  compileOutputFull : true,
  unlockSeconds     : 10,
  testValueETH      : '0.5',
}), async ({ deployed, minedTx, deployerAddress }) => {
  const ds = await deployed( 'DifferentSender', { force: true } )
 
  //const instance = await relink.getInstance() 
  const txReceipt = await minedTx( ds.send, [deployerAddress], {value: toWei('0.1', 'ether')} )
  const owner      = (await ds.owner())['0']
  const lastSender = (await ds.lastSender())['0']
  const lastPayer  = (await ds.lastPayer())['0']
  const lastValue  = (await ds.lastValue())['0']
  assert.equal( owner      , deployerAddress )
  assert.equal( lastSender , deployerAddress )
  assert.equal( lastPayer  , deployerAddress )
  assert.equal( lastValue  , toWei('0.1', 'ether') )
 
  return 22
})
