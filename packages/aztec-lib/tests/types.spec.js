'use strict'

const { assert } = require('chai')
const {
  AZTEC_TYPES: TYPES, exportAztecPublicNote, exportAztecPrivateNote
} = require('../src/utils')
const { note } = require('aztec.js')
const { parsed } = require('dotenv').config()

describe('AZTEC types', () => {

  const TEST_PUBLIC_KEY = parsed['TEST_PUBLIC_KEY_1']

  let note1
  let publicNote1
  let privateNote1

  before(async () => {
    note1 = await note.create(TEST_PUBLIC_KEY, 100)
    publicNote1  = await exportAztecPublicNote(note1)
    privateNote1 = await exportAztecPrivateNote(note1)
  })

  it('checks AZTEC note hash', async () => {
    assert( publicNote1['noteHash'],
      `Re-hydrated AZTEC public note ${publicNote1} has no note hash` )
    const result = TYPES.aztecNoteHash(publicNote1.noteHash)
    assert.notOk( result['error'],
      `New AZTEC note failed noteHash type check with ${result['error']}`
    )
  })

  it('checks AZTEC public note', async () => {
    assert( publicNote1['publicKey'],
      `Re-hydrated AZTEC public note ${publicNote1} has no public key` )
    const result = TYPES.aztecPublicNote(publicNote1)
    assert.notOk( result['error'],
      `New AZTEC note failed publicKey type check with ${result['error']}`
    )
  })

  it('checks AZTEC private note', async () => {
    assert( privateNote1['viewingKey'],
      `Re-hydrated AZTEC private note ${publicNote1} has no viewing key` )
    const result = TYPES.aztecPrivateNote(privateNote1)
    assert.notOk( result['error'],
      `New AZTEC note failed viewingKey type check with ${result['error']}`
    )
    privateNote1['noteHash'] = null
    const result2 = TYPES.aztecPrivateNote(privateNote1)
    assert.ok( result2['error'],
      `New AZTEC note did not detect missing noteHash` )
  })

})
