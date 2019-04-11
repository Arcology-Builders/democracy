const { List, Map } = require('immutable')
const assert = require('chai').assert
const path         = require('path')
const fs           = require('fs')
const { RemoteDB } = require('../src/db')
const Logger       = require('../src/logger')

const delayedGet = async (remoteDB, expected, resolve) => {
  const res = await remoteDB.getHTTP('/api/test')
  assert.equal(expected, JSON.stringify(res))
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
    const expected = `{"message":"Test posted!","a":${randInt}}`
    assert.equal(expected, JSON.stringify(res))
  })

  it( 'gets back the test object', async() => {
    const expected = `{"val":{"body":{"a":${randInt}}}}`
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        delayedGet(remoteDB, expected, resolve)
      }, 2000)
    })
  })

  it( 'posts a deeply nested object', async () => {
    const res = await remoteDB.postHTTP('/api/test', [{ 'a': [ {'b': randInt } ] }] )
    const expected = `{"0":{"a":[{"b":${randInt}}]},"message":"Test posted!"}`
    assert.equal(expected, JSON.stringify(res))
  })

  it( 'gets back a deeply nested object', async () => {
    const expected = `{"val":{"body":[{"a":[{"b":${randInt}}]}]}}`
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        delayedGet(remoteDB, expected, resolve)
      }, 2000)
    })
  })

  it( 'fails to connect to a non-existent server', async() => {
    await r2.postHTTP('/api/test', { 'a': randInt } )
      .then((v) => { assert.fail(`Should have failed to connect, instead ${v}`) })
      .catch((e) => { assert.equal(JSON.stringify(e),
        '{"name":"RequestError","message":"Error: connect ECONNREFUSED 127.0.0.1:36666",'+
        '"cause":{"errno":"ECONNREFUSED","code":"ECONNREFUSED","syscall":"connect",' +
        '"address":"127.0.0.1","port":36666},"error":{"errno":"ECONNREFUSED","code":' +
        '"ECONNREFUSED","syscall":"connect","address":"127.0.0.1","port":36666},'+
        `"options":{"uri":"http://localhost:36666/api/test","body":{"a":${randInt}},`+
        '"json":true,"method":"POST","headers":{"Content-Length":7},"simple":true,'+
        '"resolveWithFullResponse":false,"transform2xxOnly":false}}'
     ) })
  })

})
