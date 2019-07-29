'use strict'
const BN        = require('bn.js')
const assert    = require('chai').assert
const { Map }   = require('immutable')
const { toWei } = require('ethjs-unit')
const { toChecksumAddress }
                = require('ethereumjs-util')

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
  const owner      = toChecksumAddress((await ds.owner())['0'])
  const lastSender = toChecksumAddress((await ds.lastSender())['0'])
  const lastPayer  = toChecksumAddress((await ds.lastPayer())['0'])
  const lastValue  = (await ds.lastValue())['0']
  assert.equal( owner      , deployerAddress )
  //assert.equal( lastSender , deployerAddress )
  //assert.equal( lastPayer  , deployerAddress )
  assert.equal( lastValue.toString()  , toWei('0.1', 'ether').toString() )
 
  return 22
})
