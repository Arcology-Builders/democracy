const { immEqual } = require('..')
const { Map, List } = require('immutable')
const assert = require('chai').assert

describe('Utilities ', () => {

  it( 'two immutable Maps are equal' , () => {
    assert.ok(    immEqual(new Map({'a': 1}), new Map({'a': 1})) )
    assert.notOk( immEqual(new Map({'a': 1}), new Map({'b': 1})) )
  })

})
