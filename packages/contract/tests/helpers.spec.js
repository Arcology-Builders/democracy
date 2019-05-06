const { createBM } = require('..')
const { delayedGet } = require('demo-client')
const { setImmutableKey, getImmutableKey, immEqual } = require('demo-utils')
const { Map } = require('immutable')
const assert = require('chai').assert

describe( 'remote builds manager', () => {
 
  let bm 

  before( async () => {
    bm = await createBM({ autoConfig: true })
    // Reset it so we can see the change
    await bm.outputter('test/bm', new Map({"a": 2}), true)
  })
  
  it( "doesn't use the default {get,set}ImmutableKey", async () => {
    assert.notEqual( bm.inputter, getImmutableKey )
    assert.notEqual( bm.outputter, setImmutableKey )
  })

  it( 'creates a BM from autoConfig DB URL', async () => {
    await bm.outputter('test/bm', new Map({"a": 1}), true)
    delayedGet( bm.inputter.bind(null, 'test/bm'), new Map({"a":1}), immEqual )
  })

  it( 'creates a BM from local get/set', async () => {
    const bm2 = await createBM({ autoConfig: false, chainId: 'xx' })
    assert.equal( bm2.inputter, getImmutableKey )
    assert.equal( bm2.outputter, setImmutableKey )
  })

})
