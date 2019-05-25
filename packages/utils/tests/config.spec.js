const { getConfig, setEnvVars } = require('../src/config')
require('dotenv').config()
setEnvVars(process.env)

const { version } = require('../package')
const { getNetwork, getEndpointURL, arraysEqual } = require('..')
const { List, Map } 
             = require('immutable')
const chai   = require('chai')
const assert = chai.assert
const { Logger } = require('../src/logger')
const LOGGER = new Logger('config.spec')

describe('config has correct members', () => {

  before(() => {
    process.env['NODE_ENV'] = 'DEVELOPMENT'
  })

  it('development configs are expected', () => {
    process.env['NODE_ENV'] = 'DEVELOPMENT'
    assert( arraysEqual([ 'info', 'debug', 'warn', 'error' ], getConfig()['LOG_LEVELS']) )
    assert.equal( getConfig()['ETH_URL'], 'http://localhost:8545' )
    assert.equal( getConfig()['DB_URL'], 'http://localhost:7000' )
    assert.equal( getConfig()['DEPLOYER_ADDRESS'],
      '0x63c8362f68b364ca2a6a8d7b5aecc99a5a704f7f' )
    assert.equal( getConfig()['DEPLOYER_PASSWORD'],
      '26dcf491633e38c9ed6ccb44599181c8490e27b5dd4a35ccb754f761fcb66b3e' )
    assert.equal( getConfig()['GAS_LIMIT'], '7000000' )
    assert.equal( getConfig()['GAS_PRICE'], '7' )
    assert.equal( getConfig()['VERSION'], version )
  })

  it('test configs are expected', () => {
    process.env['NODE_ENV'] = 'TEST'
    assert( arraysEqual([ 'info', 'warn', 'error' ], getConfig()['LOG_LEVELS']) )
    assert.equal( getConfig()['ETH_URL'], 'http://test.arcology.nyc:8545' )
    assert.equal( getConfig()['DB_URL'], 'http://test.arcology.nyc:7000' )
    assert.equal( getConfig()['DEPLOYER_ADDRESS'],
      '0x5153952607794179dba5cbde2f4c6c3391012978' )
    assert.equal( getConfig()['DEPLOYER_PASSWORD'],
      '82f67b076e39ed5490d70969c37702f311a333aa0062bd70bef2338f1c439906' )
    assert.equal( getConfig()['GAS_LIMIT'], '6000000' )
    assert.equal( getConfig()['GAS_PRICE'], '6' )
    assert.equal( getConfig()['VERSION'], version )
  })

  it('rinkeby configs are expected', () => {
    process.env['NODE_ENV'] = 'RINKEBY'
    assert( arraysEqual([ 'warn', 'error' ], getConfig()['LOG_LEVELS']) )
    assert.equal( getConfig()['ETH_URL'], 'https://rinkeby.infura.io/1234567890' )
    assert.equal( getConfig()['DB_URL'], 'http://ganache.arcology.nyc:7000' )
    assert.notOk( getConfig()['DEPLOYER_PASSWORD'],
      'Rinkeby deployer password should not be defined in .env' )
  })

  it('mainnet configs are expected', () => {
    process.env['NODE_ENV'] = 'MAINNET'
    assert( arraysEqual([ 'warn', 'error' ], getConfig()['LOG_LEVELS']) )
    assert.equal( getConfig()['ETH_URL'], 'https://mainnet.infura.io/1234567890' )
    assert.equal( getConfig()['DB_URL'], 'http://ganache.arcology.nyc:7000' )
    assert.notOk( getConfig()['DEPLOYER_ADDRESS'],
      'Mainnet deployer address should not be defined in .env' )
  })

})
