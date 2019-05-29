const { equal, immEqual, parseLogLevels, deepEqual, textsEqual } = require('..')
const { Map } = require('immutable')
const assert = require('chai').assert
const fs = require('fs')

describe('Utilities ', () => {

  it( 'determines if two immutable Maps are equal' , () => {
    assert.ok(    immEqual(new Map({'a': 1}), new Map({'a': 1})) )
    assert.notOk( immEqual(new Map({'a': 1}), new Map({'b': 1})) )
  })

  it( 'auto-detects equal values' , () => {
    assert.ok( equal(22, 22) )
    assert.notOk( equal(22, 23) )
    assert.ok( equal('{"a":1}', '{"a":1}' ) )
    assert.notOk( equal('{"a":1}', '{"b":1}' ) )
    assert.ok( equal({'a':1}, {'a':1} ) )
    assert.notOk( equal({'a':1}, {'b':1} ) )
    assert.ok( equal(new Map({'a': 1}), new Map({'a': 1})) )
    assert.notOk( equal(new Map({'a': 1}), new Map({'b': 1})) )
    assert.notOk( equal(new Map({'a': 1}), new Map({'b': 1})) )
  })

  it( 'log levels are parsed and lowercased', () => {
    assert( deepEqual(parseLogLevels('WARN,DeBuG,info'), [ 'warn', 'debug', 'info' ]) )
  })

  it( 'detects equality in text lines', () => {
    const expected = fs.readFileSync('./tests/expected.txt').toString()
    const altered  = fs.readFileSync('./tests/altered.txt').toString()
    assert.equal( textsEqual(expected, altered), 5,
                  `A difference was found on the indicated line` )
  })

})
