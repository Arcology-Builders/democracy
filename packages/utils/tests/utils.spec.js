const { equal, immEqual, parseLogLevels, deepEqual } = require('..')
const { Map, List } = require('immutable')
const assert = require('chai').assert

describe('Utilities ', () => {

  it( 'two immutable Maps are equal' , () => {
    assert.ok(    immEqual(new Map({'a': 1}), new Map({'a': 1})) )
    assert.notOk( immEqual(new Map({'a': 1}), new Map({'b': 1})) )
  })

  it( 'equal values are auto-detected ' , () => {
    assert.ok( equal(22, 22) )
    assert.notOk( equal(22, 23) )
    assert.ok( equal('{"a":1}', '{"a":1}' ) )
    assert.notOk( equal('{"a":1}', '{"b":1}' ) )
    assert.ok( equal({"a":1}, {"a":1} ) )
    assert.notOk( equal({"a":1}, {"b":1} ) )
    assert.ok( equal(new Map({'a': 1}), new Map({'a': 1})) )
    assert.notOk( equal(new Map({'a': 1}), new Map({'b': 1})) )
    assert.notOk( equal(new Map({'a': 1}), new Map({'b': 1})) )
  })

  it( 'log levels are parsed and lowercased', () => {
    assert( deepEqual(parseLogLevels('WARN,DeBuG,info'), [ 'warn', 'debug', 'info' ]) )
  })

})
