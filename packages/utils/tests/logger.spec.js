'use strict'
const { List, Map } 
             = require('immutable')
const chai   = require('chai')
const assert = chai.assert
const { fromJS }
             = require('..')
const { Logger } = require('../src/logger')

describe('logger facility', () => {

  let logger

  before(() => {
    logger = new Logger('prefix', ['info', 'debug'])
  })

  it('basic logging works', () => {
    logger.debug('a debug message')
    logger.info('an info message')
  })

  it('multiple messages', () => {
    logger.debug('first debug message', { 'a': 1 } )
    logger.info('first info message', Map({ 'a': 1}))
  })

})
