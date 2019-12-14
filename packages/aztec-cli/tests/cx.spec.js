'use strict'
const BN = require('bn.js')
const { doCxAmount, doMintAmount } = require('..')
const { getConfig, Logger } = require('demo-utils')
const { wallet } = require('demo-keys')
const { parsed } = require('dotenv').config()
const { Map, List } = require('immutable')
const { keccak } = require('ethereumjs-util')
const { abiEncoder : { outputCoder } } = require('aztec.js')
const chai = require('chai')
const assert = chai.assert
const expect = chai.expect
chai.use(require('chai-as-promised'))

const { proofs : { JOIN_SPLIT_PROOF } } = require('@aztec/dev-utils')

const LOGGER = new Logger('cx.spec')

describe('Confidential transfers', () => {

  const tradeSymbol = 'AAA'
  const DEPLOYER_ADDRESS = getConfig()['DEPLOYER_ADDRESS']
  const DEPLOYER_PASSWORD = getConfig()['DEPLOYER_PASSWORD']
  const DEPLOYER_PUBLIC_KEY = '0x04b56dcc4375e855adba8f37a2a9cce64809b3d24d1981daa7c9e3f98316676b06b27a85b889559c09ad442f2636491ceb6930589cee609258df8da29e852a1312'

  it('succeed transferring whole amount after minting', async () => {

    const senderNoteHash = await doMintAmount({
      amount        : new BN(22),
      tradeSymbol   : 'AAA',
      senderIndex   : 1,
      unlockSeconds : 250,
    })
    const cxResult = await doCxAmount({ amount: 22, senderNoteHash, senderIndex: 1 })
    
    // Transferring the same note hash a second time fails
    await expect(
      doCxAmount({ amount: 22, senderNoteHash, senderIndex: 1 })
    ).to.be.rejectedWith(Error)

  })

  it('transferring zero succeeds multiple times', async () => {
    const senderNoteHash = await doMintAmount({
      amount      : new BN(0),
      tradeSymbol : 'AAA',
      senderIndex : 1
    })
    await doCxAmount({
      amount         : 0,
      senderNoteHash,
      transferAll    : true,
      senderIndex    : 1,
    })
    const senderNoteHash2 = await doMintAmount({
      amount      : new BN(0),
      tradeSymbol : 'AAA',
      senderIndex : 1
    })
    await doCxAmount({
      amount         : 0,
      senderNoteHash : senderNoteHash2,
      transferAll    : true,
      senderIndex    : 1,
    })
  })

  it('succeed transferring whole amount using transferAll', async () => {

    const senderNoteHash = await doMintAmount({
      amount: new BN(500),
      senderIndex: 1,
    })
    const cxResult = (await doCxAmount({
      amount         : 0,
      senderNoteHash,
      transferAll    : true,
      senderIndex    : 1,
    })).toJS()
    
    // Transferring the same note hash a second time fails
    await expect(
      doCxAmount({
        amount         : 0,
        senderNoteHash,
        transferAll    : true,
        senderIndex    : 1,
      })
    ).to.be.rejectedWith(Error)

  })

  /*
  it('succeed transferring partial amount after minting', async () => {

    const senderNoteHash = await doMintAmount({
      amount: new BN(33),
      senderIndex: 1,
    })
    const cxResult = (await doCxAmount({
      amount         : 11,
      senderNoteHash,
      senderIndex    : 1,
    }))
    console.log('cxResult', cxResult.keys())
    const receiverNoteHash = cxResult.unlabeled.receiverNoteHash
    assert.equal( receiverNoteHash.length, 66, 'receiverNoteHash should be a 256-bit hash' )

  })

  it('fails to transfer from insufficient funds', async () => {
    const senderNoteHash = await doMintAmount({
      amount: new BN(11)
    })

    await expect(
      doCxAmount({ amount: 22, senderNoteHash, senderIndex: 1 })
    ).to.be.rejectedWith(Error)
  })
*/
  after(() => {
    wallet.shutdownSync()
  })

})
