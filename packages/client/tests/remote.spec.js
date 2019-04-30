const { List, Map } = require('immutable')
const assert = require('chai').assert
const path         = require('path')
const { RemoteDB } = require('../src/client')
const { Logger }   = require('demo-utils')

const { delayedGet } = require('../src/helpers')

describe('Remote DB tests', () => {

  const LOGGER   = new Logger('RemoteDB Test')
  const remoteDB = new RemoteDB('localhost', 7000)
  // Create an invalid remote DB that does not have anything listening to it 
  const r2 = new RemoteDB('localhost', 36666)

  const randInt  = Math.round(Math.random() * 10)
  
  it( 'posts a test object', async () => {
    const res = await remoteDB.postHTTP('/api/test', { 'a': randInt }, true )
    const expected = `{"message":"Test posted!","a":${randInt}}`
    assert.equal(res, expected)
  })

  it( 'gets back the test object', async () => {
    const expected = `{"val":{"body":{"a":${randInt}}}}`
    return delayedGet(remoteDB.getHTTP.bind(remoteDB, '/api/test'), expected)
  })

  it( 'posts a deeply nested object', async () => {
    const res = await remoteDB.postHTTP('/api/test', [{ 'a': [ {'b': randInt } ] }], true )
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

  it( 'fails to connect to a non-existent server', async () => {
    await r2.postHTTP('/api/test', { 'a': randInt } )
      .then((v) => { assert.fail(`Should have failed to connect, instead ${v}`) })
      .catch((e) => { assert.equal( e.message,
        'Unable to connect to localhost:36666 after 5 retries') })
  })

})
