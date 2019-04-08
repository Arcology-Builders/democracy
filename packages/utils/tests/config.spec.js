const { List, Map } 
             = require('immutable')
const chai   = require('chai')
const assert = chai.assert
const { getNetwork, getEndpointURL, arraysEqual }
             = require('..')
const Logger = require('../src/logger')
const { getConfig } = require('../src/config')

describe('config has correct members', () => {

  before(() => {
    process.env['NODE_ENV'] = 'DEVELOPMENT'
  })

  it('development log levels are expencted', () => {
    process.env['NODE_ENV'] = 'DEVELOPMENT'
    assert( arraysEqual([ 'info', 'debug', 'warn', 'error' ], getConfig()['LOG_LEVELS']) )
    assert.equal( getConfig()['ETH_URL'], 'http://localhost:8545' )
    assert.equal( getConfig()['DB_URL'], 'http://localhost:7000' )
  })

  it('test log levels are expected', () => {
    process.env['NODE_ENV'] = 'TEST'
    assert( arraysEqual([ 'info', 'warn', 'error' ], getConfig()['LOG_LEVELS']) )
    assert.equal( getConfig()['ETH_URL'], 'http://test.arcology.nyc:8545' )
    assert.equal( getConfig()['DB_URL'], 'http://test.arcology.nyc:7000' )
  })

  it('rinkeby log levels are expected', () => {
    process.env['NODE_ENV'] = 'RINKEBY'
    assert( arraysEqual([ 'warn', 'error' ], getConfig()['LOG_LEVELS']) )
    assert.equal( getConfig()['ETH_URL'], 'https://rinkeby.infura.io/1234567890' )
    assert.equal( getConfig()['DB_URL'], 'http://ganache.arcology.nyc:7000' )
  })

  it('mainnet log levels are expected', () => {
    process.env['NODE_ENV'] = 'MAINNET'
    assert( arraysEqual([ 'warn', 'error' ], getConfig()['LOG_LEVELS']) )
    assert.equal( getConfig()['ETH_URL'], 'https://mainnet.infura.io/1234567890' )
    assert.equal( getConfig()['DB_URL'], 'http://ganache.arcology.nyc:7000' )
  })

})
