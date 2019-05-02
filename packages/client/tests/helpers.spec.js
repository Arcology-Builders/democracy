const { createBM, delayedGet } = require('..')
const { setImmutableKey, getImmutableKey } = require('demo-utils')
const assert = require('chai').assert

describe( 'client helper', () => {
  
  it( 'creates a BM from default DB URL', async () => {
    const BM = createBM({chainId: '22', autoConfig: true})
    await BM.outputter('compiles/test', {"a": 1}, true)
    delayedGet( BM.inputter.bind(null, 'compiles/test'), '{"a":1}' )
    assert.notEqual( BM.inputter, getImmutableKey )
    assert.notEqual( BM.outputter, setImmutableKey )
  })

  it( 'creates a BM from local get/set', async () => {
    const BM = createBM({chainId: '22' })
    assert.equal( BM.inputter, getImmutableKey )
    assert.equal( BM.outputter, setImmutableKey )
  })

})
