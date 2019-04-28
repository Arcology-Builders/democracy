const { immEqual, parseLogLevels, deepEqual } = require('..')
const { Map, List } = require('immutable')
const assert = require('chai').assert

describe('Utilities ', () => {

  it( 'two immutable Maps are equal' , () => {
    assert.ok(    immEqual(new Map({'a': 1}), new Map({'a': 1})) )
    assert.notOk( immEqual(new Map({'a': 1}), new Map({'b': 1})) )
  })

  it( 'log levels are parsed and lowercased', () => {
    assert( deepEqual(parseLogLevels('WARN,DeBuG,info'), [ 'warn', 'debug', 'info' ]) )
  })

})
