const { List, Map } = require('immutable')
const assert = require('chai').assert
const path         = require('path')
const fs           = require('fs')
const { RemoteDB } = require('../src/db')
const Logger       = require('../src/logger')

describe('Remote DB tests', () => {

  let LOGGER   = new Logger('RemoteDB Test')
  let remoteDB = new RemoteDB('realblocks.arcology.nyc', 7000)

  let randInt  = Math.round(Math.random() * 10)
  
  it('posts a test object', async () => {
    const res = await remoteDB.postHTTP('/api/test', { 'a': randInt } )
    const expected = `{"message":"Test posted!","a":"${randInt}"}`
    assert.equal(expected, res.toString())
  })

  it('gets back the test object', async() => {
    const res = await remoteDB.getHTTP('/api/test')
    const expected = `{"val":{"body":{"a":"${randInt}"}}}`
    assert.equal(expected, res.toString())
  })

})
