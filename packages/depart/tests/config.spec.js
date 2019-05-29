'use strict'

const { getConfig, deepEqual, Logger } = require('demo-utils')
const LOGGER = new Logger('config.spec')

const assert = require('chai').assert

describe( 'Configs for departures', () => {
  
  const config = getConfig()
  it( 'picks up log levels from .env', async () => {
    assert( deepEqual( config['LOG_LEVELS'], ['info', 'warn', 'error']) )
  })

  it( 'picks up db url from .env', async () => {
    assert.equal( config['DB_URL'], 'http://localhost:7000' )
  })

})
