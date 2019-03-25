const { List, Map } 
             = require('immutable')
const chai   = require('chai')
const assert = chai.assert
const { getNetwork, getEndpointURL, arraysEqual }
             = require('..')
const Logger = require('../src/logger')
const { getConfig } = require('../src/config')

describe('config has correct members', () => {

  let eth

  before(() => {
    process.env['NODE_ENV'] = 'DEVELOPMENT'
  })

  it('development log levels are expencted', () => {
    process.env['NODE_ENV'] = 'DEVELOPMENT'
    assert( arraysEqual([ 'info', 'debug', 'warn', 'error' ], getConfig()['LOG_LEVELS']) )
  })

  it('test log levels are expected', () => {
    process.env['NODE_ENV'] = 'TEST'
    assert( arraysEqual([ 'info', 'warn', 'error' ], getConfig()['LOG_LEVELS']) )
  })

  it('rinkeby log levels are expected', () => {
    process.env['NODE_ENV'] = 'RINKEBY'
    assert( arraysEqual([ 'warn', 'error' ], getConfig()['LOG_LEVELS']) )
  })

  it('mainnet log levels are expected', () => {
    process.env['NODE_ENV'] = 'MAINNET'
    assert( arraysEqual([ 'warn', 'error' ], getConfig()['LOG_LEVELS']) )
  })

})
