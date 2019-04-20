const { List, Map } = require('immutable')
const assert = require('chai').assert
const path         = require('path')
const { RemoteDB } = require('../src/client')
const { Logger }   = require('@democracy.js/utils')

const { delayedGet, syncify } = require('./common')

describe('Remote DB tests', () => {

  const LOGGER   = new Logger('RemoteDB Test')
  const remoteDB = new RemoteDB('ganache.arcology.nyc', 7000)
  // Create an invalid remote DB that does not have anything listening to it 
  const r2 = new RemoteDB('localhost', 36666)

  const randInt  = Math.round(Math.random() * 10)
  
  it( 'posts a test object', async () => {
    const res = await remoteDB.postHTTP('/api/test', { 'a': randInt } )
    const expected = `{"message":"Test posted!","a":${randInt}}`
    assert.equal(res, expected)
  })

  it( 'gets back the test object', async () => {
    const expected = `{"val":{"body":{"a":${randInt}}}}`
    return delayedGet(remoteDB.getHTTP.bind(remoteDB, '/api/test'), expected)
  })

  it( 'posts a deeply nested object', async () => {
    const res = await remoteDB.postHTTP('/api/test', [{ 'a': [ {'b': randInt } ] }] )
    const expected = `{"0":{"a":[{"b":${randInt}}]},"message":"Test posted!"}`
    assert.equal(res, expected)
  })

  it( 'gets back a deeply nested object', async () => {
    const expected = `{"val":{"body":[{"a":[{"b":${randInt}}]}]}}`
    return delayedGet(remoteDB.getHTTP.bind(remoteDB, '/api/test'), expected)
  })

  it( 'fails to overwrite accidentally', async () => {
    const res = await remoteDB.postHTTP('/api/test', [{ 'a': [ {'b': randInt } ] }] )
    return delayedGet(remoteDB.getHTTP.bind(remoteDB, '/api/test'),
                      `{"val":{"body":[{"a":[{"b":${randInt}}]}]}}`)
  })

  it( 'succeeds in overwriting', async () => {
    const res = await remoteDB.postHTTP('/api/test', [{ 'a': [ {'b': randInt } ] }], true )
    return delayedGet(remoteDB.getHTTP.bind(remoteDB, '/api/test'),
                      `{"val":{"body":[{"a":[{"b":${randInt}}]}]}}`)
  })

  it( 'fails to connect to a non-existent server', (done) => {
    syncify(async () => {
      await r2.postHTTP('/api/test', { 'a': randInt } )
        .then((v) => { assert.fail(`Should have failed to connect, instead ${v}`) })
        .catch((e) => { assert.equal(JSON.stringify(e),
          '{"errno":"ECONNREFUSED","code":"ECONNREFUSED","syscall":"connect","address":"127.0.0.1","port":36666}'
       ) })
    }, done)
  })

})
