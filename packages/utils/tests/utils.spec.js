const {
  equal, immEqual, parseLogLevels, deepEqual, textsEqual,
  timeStampSecondsToBlockNumber, getNetwork
}             = require('..')
const { Map } = require('immutable')
const assert  = require('chai').assert
const fs      = require('fs')
const BN      = require('bn.js')

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
      'A difference was found on the indicated line' )
  })

  it( 'converts a timestamp to a blocknumber', async () => {
    const eth = getNetwork()
    const blockNow = await eth.blockNumber()
    const blockNumber = await timeStampSecondsToBlockNumber((Date.now() + 20000) / 1000)
    assert( BN.isBN(blockNumber), `blockNumber ${blockNumber} is not a BN` )
    assert( BN.isBN(blockNow), `blockNow ${blockNow} is not a BN` )
    assert( blockNumber.gte(blockNow), 'Converted blockNumber before block of now' )
    assert( blockNumber.lte(blockNow.add(new BN(1))), 'Converted blockNumber after two blocks from now' )
    const blockNumber2 = await timeStampSecondsToBlockNumber(Math.round(Date.now()/1000) + 10000)
    assert( BN.isBN(blockNumber2), `blockNumber2 ${blockNumber2} is not a BN` )
    assert( blockNumber2.gte(blockNow.add(new BN(Math.round(10000/15)))), `Converted blockNumber ${blockNumber2} before 10,000 seconds of now` )
    assert( blockNumber2.lte(blockNow.add((new BN((10000/15) + 1)))), 'Converted blockNumber after 10,000 seconds + 1 block from now' )
  })

})
