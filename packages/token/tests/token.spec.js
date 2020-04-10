'use strict'

const { assert } = require('chai')
const token = require('..')
const BN = require('bn.js')

const TOKEN_ADDRESS2 = '0xa821f14fb6394e82839f5161f214cacc90372453'
const TOKEN_ADDRESS = '0xdac17f958d2ee523a2206206994597c13d831ec7'

describe('token-provenance', () => {

  before(async () => {
    await token.init()
  })

  it('has correct Transfer event topic', async () => {
    assert.equal(
      token.getTransferEventTopic(),
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
    )
  })

  it('retrieves all logs from a block', async () => {
    const logs = await token.getLogsFromBlock(new BN(9836094), TOKEN_ADDRESS)
    assert.equal(logs.count(), 147)
    const logs2 = await token.getLogsFromBlock(new BN(9836094), TOKEN_ADDRESS)
    assert.equal(logs2.count(), 147)
  })

  it('getLogsFromAllBlocks for one block is same as getLogFromBlock (cached)', async () => {
    const logs = await token.getLogsFromAllBlocks(
      new BN(9836080),
      new BN(9836080),
      TOKEN_ADDRESS,
    )
    assert.equal(logs.count(), 8)
  })

  it('retrieves all the log events from contiguous 10 blocks', async () => {
    const logs = await token.getLogsFromAllBlocks(
      new BN(9836080),
      new BN(9836090),
      TOKEN_ADDRESS
    )
    assert.equal(logs.count(), 418)
  })


  it('retrieves all the log events to an address (single)', async () => {
    const fromAddresses = await token.getAllFromAddresses(
      TOKEN_ADDRESS,
      '0xd7e88caf870c342c70867dddd2f95f6d0da85b30', // to address
      new BN(9836080),
      new BN(9836090),
    )
    console.log(JSON.stringify(fromAddresses.toJS()))
    assert.equal(fromAddresses.count(), 1)
    assert.equal(fromAddresses.get(0), '0x646755a02536623e0d22320d4a6ecf1046017180')
  })

  it('retrieves all the log events to an address (multiple)', async () => {
    const fromAddresses = await token.getAllFromAddresses(
      TOKEN_ADDRESS,
      '0x184d6634b7230154697fe028f66399fcc4ca4bf3', // to address
      new BN(9843036),
      new BN(9843070),
    )
    console.log(JSON.stringify(fromAddresses.toJS()))
    assert.equal(fromAddresses.count(), 19)
    assert.equal(fromAddresses.get(0), '0x7b01e3a36678d5a67bacd6a264adaba0b5ad526e')
  })

})
