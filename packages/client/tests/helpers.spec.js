const { createBM, delayedGet } = require('..')
const { setImmutableKey, getImmutableKey } = require('demo-utils')
const assert = require('chai').assert

describe( 'client helper', () => {
 
  let remoteBM

  before( async () => {
    remoteBM = createBM({chainId: '22', autoConfig: true})
    // Reset it so we can see the change
    await remoteBM.outputter('test/bm', {"a": 2}, true)
  })

  it( 'creates a BM from default DB URL', async () => {
    await remoteBM.outputter('test/bm', {"a": 1}, true)
    delayedGet( remoteBM.inputter.bind(null, 'test/bm'), '{"a":1}' )
    assert.notEqual( remoteBM.inputter, getImmutableKey )
    assert.notEqual( remoteBM.outputter, setImmutableKey )
  })

  it( 'creates a BM from local get/set', async () => {
    const BM = createBM({chainId: '22' })
    assert.equal( BM.inputter, getImmutableKey )
    assert.equal( BM.outputter, setImmutableKey )
  })

})
