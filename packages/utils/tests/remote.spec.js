const { List, Map } = require('immutable')
const assert = require('chai').assert
const path         = require('path')
const fs           = require('fs')
const { RemoteDB } = require('../src/db')
const Logger       = require('../src/logger')

describe('Remote DB tests', () => {

  let LOGGER   = new Logger('RemoteDB Test')
  let remoteDB = new RemoteDB('realblocks.arcology.nyc', 7000)

  it('posts a test object', async () => {
    res = await remoteDB.postHTTP('/api/tests', { 'a': 1 } )
    LOGGER.debug('Response', res)
  })

})
