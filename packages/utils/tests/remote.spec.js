const { List, Map } = require('immutable')
const assert = require('chai').assert
const path         = require('path')
const fs           = require('fs')
const { RemoteDB } = require('../src/db')
const Logger       = require('../src/logger')

const delayedGet = async (remoteDB, randInt, resolve) => {
  const res = await remoteDB.getHTTP('/api/test')
  const expected = `{"val":{"body":{"a":"${randInt}"}}}`
  assert.equal(expected, res.toString())
  resolve()
}

describe('Remote DB tests', () => {

  const LOGGER   = new Logger('RemoteDB Test')
  const remoteDB = new RemoteDB('ganache.arcology.nyc', 7000)
  // Create an invalid remote DB that does not have anything listening to it 
  const r2 = new RemoteDB('localhost', 36666)

  const randInt  = Math.round(Math.random() * 10)
  
  it( 'posts a test object', async () => {
    const res = await remoteDB.postHTTP('/api/test', { 'a': randInt } )
    const expected = `{"message":"Test posted!","a":"${randInt}"}`
    assert.equal(expected, res.toString())
  })

  it( 'gets back the test object', async() => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        delayedGet(remoteDB, randInt, resolve)
      }, 1000)
    })
  })

  it( 'fails to connect to a non-existent server', async() => {
    await r2.postHTTP('/api/test', { 'a': randInt } )
      .then((v) => { assert.fail(`Should have failed to connect, instead ${v}`) })
      .catch((e) => { assert.equal(JSON.stringify(e),
         `{"errno":"ECONNREFUSED","code":"ECONNREFUSED",` +
         `"syscall":"connect","address":"127.0.0.1","port":36666}`) })
  })

})
