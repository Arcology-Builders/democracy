const fs     = require('fs')
const path   = require('path')
const chai   = require('chai')
chai.use(require('chai-as-promised'))
const assert = chai.assert
const expect = chai.expect
const { Map } = require('immutable')

const RESTServer = require('../src/server')
const { RemoteDB, Logger, setImmutableKey, DB_DIR, COMPILES_DIR }
                 = require('@democracy.js/utils')
const LOGGER     = new Logger('rest.spec')

describe('Runs a REST server', () => {

  const server = new RESTServer(6666, true)
  const r = new RemoteDB('localhost', 6666)

  const randInt = Math.round(Math.random() * 100)

  before(async () => {
    server.start()
  })

  it( 'starts a REST server that handles a test request' , async () => {
    const res = await r.postHTTP('/api/test', { 'a': randInt })
    const expected = `{"message":"Test posted!","a":${randInt}}`
    assert.equal(JSON.stringify(res), expected)
  })

  it( 'posting to a non-listening server times out and fails' , async () => {
    /*
    await expect( r.postHTTP('/api/test', { 'a': randInt }) )
      .to.be.rejectedWith(Error)
     */
    return r.postHTTP('/api/test', { 'a': randInt })
    .then((v) => { assert.fail('Should have failed to connect to a non-existent server') })
    .catch((e) => {
      LOGGER.info('ERROR', e)
    })
   
  })

  it( 'adds a new route', async () => {
    const router = server.getRouter()
    router.route('/someRoute').get((req, res) => {
      res.json({ 'a': randInt+1 })
    })
    const res = await r.getHTTP('/api/someRoute', {})
    assert.equal( JSON.stringify(res), `{"a":${randInt+1}}`)
  }) 
  
  it( 'get all empty compiles', async () => {
    const res = await r.getHTTP('/api/compiles', {})
    assert.equal( JSON.stringify(res), `{}`)
  })

  it( 'get all compiles', async () => {
    setImmutableKey('/compiles/FirstContract', new Map({}))
    setImmutableKey('/compiles/SecondContract', new Map({}))
    const res = await r.getHTTP('/api/compiles', {})
    assert.equal( JSON.stringify(res), '{"FirstContract":{},"SecondContract":{}}')
  })
  
  after(async () => {
    fs.unlinkSync(path.join(DB_DIR, COMPILES_DIR, 'FirstContract.json'))
    fs.unlinkSync(path.join(DB_DIR, COMPILES_DIR, 'SecondContract.json'))
    server.stop()
  })

})

