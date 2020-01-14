'use strict'
const BN = require('bn.js')
const aztec = require('aztec.js')
const { doCxAmount, doMintAmount } = require('..')
const { exportAztecPrivateNote, AZTEC_TYPES : TYPES } = require('demo-aztec-lib')
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

  it('uses a passed in receiver note', async () => {
    
    const senderNoteHash = await doMintAmount({
      amount: new BN(500),
      senderIndex: 1,
    })
    assert( TYPES.aztecPublicKey(parsed['TEST_PUBLIC_KEY_1']),
      'No public key for receiverNote found.' )
    const receiverPrivateNote = await exportAztecPrivateNote(await aztec.note.create(parsed['TEST_PUBLIC_KEY_1'], new BN(23)))

    // Specifying both receiverPrivateNote and transferAll will result in error
    await expect(
      doCxAmount({
        transferAll : true,
        senderIndex: 1,
        senderNoteHash,
        receiverPrivateNote,
      })
    ).to.be.rejectedWith(Error)

    // Specifying both receiverPrivateNote and transferValue will result in error
    // even if the values are the same
    await expect(
      doCxAmount({
        amount: 23,
        senderIndex: 1,
        senderNoteHash,
        receiverPrivateNote,
      })
    ).to.be.rejectedWith(Error)

    const cxResult = (await doCxAmount({
      senderNoteHash,
      senderIndex : 1,
      receiverPrivateNote,
    })).toJS()

    assert.equal(cxResult.unlabeled.jsReceiverNote.noteHash, receiverPrivateNote.noteHash,
      'passed in receiver note was not used.'
    )

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
