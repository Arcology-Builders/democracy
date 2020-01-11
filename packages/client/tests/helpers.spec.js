const { createInOut, delayedGet } = require('..')
const { setImmutableKey, getImmutableKey, immEqual } = require('demo-utils')
const { Map } = require('immutable')
const assert = require('chai').assert

describe( 'client helper', () => {
 
  let inputter
  let outputter

  before( async () => {
    inout = await createInOut({ autoConfig: true })
    inputter = inout.inputter
    outputter = inout.outputter
    // Reset it so we can see the change
    await outputter('test/bm', new Map({"a": 2}), true)
  })

  it( 'creates a BM from default DB URL', async () => {
    await outputter('test/bm', new Map({"a": 1}), true)
    delayedGet( inputter.bind(null, 'test/bm'), new Map({"a":1}), immEqual )
    assert.notEqual( inputter, getImmutableKey )
    assert.notEqual( outputter, setImmutableKey )
  })

  it( 'creates a BM from local get/set', async () => {
    const { inputter, outputter } = await createInOut({ autoConfig: false })
    assert.equal( inputter, getImmutableKey )
    assert.equal( outputter, setImmutableKey )
  })

})
