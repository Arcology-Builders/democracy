const fs     = require('fs')
const path   = require('path')
const chai   = require('chai')
chai.use(require('chai-as-promised'))
const assert = chai.assert
const expect = chai.expect
const { Map } = require('immutable')

const { Logger, setImmutableKey, DB_DIR, COMPILES_DIR, setFS, setPath }
                 = require('@democracy.js/utils')
const LOGGER     = new Logger('rest.spec')
const { RemoteDB } = require('../src/client')

setFS(fs)
setPath(path)

const { RESTServer } = require('../src/server')

describe('Runs a REST server', () => {

  const server = new RESTServer(6666, true)
  const r = new RemoteDB('localhost', 6666)

  const randInt = Math.round(Math.random() * 100)

  before(async () => {
    server.start()
  })

  it( 'starts a REST server that handles a test request' , async () => {
    const res = await r.postHTTP('/api/test', { 'a': randInt }, true)
    const expected = `{"message":"Test posted!","a":${randInt}}`
    assert.equal( res, expected )
  })

  it( 'posting to a non-listening server times out and fails' , async () => {
    server.stop()
    /*
    await expect( r.postHTTP('/api/test', { 'a': randInt }) )
      .to.be.rejectedWith(Error)
     */
    await r.postHTTP('/api/test', { 'a': randInt }, true)
    .then((v) => { assert.fail('Should have failed to connect to a non-existent server') })
    .catch((e) => {
      LOGGER.info('ERROR', e)
    })
   
    server.start()
  })

  it( 'adds a new route', async () => {
    const router = server.getRouter()
    router.route('/someRoute').get((req, res) => {
      res.json({ 'a': randInt+1 })
    })
    const res = await r.getHTTP('/api/someRoute', {})
    assert.equal( res, `{"a":${randInt+1}}` )
  }) 
  
  it( 'get all empty compiles', async () => {
    const res = await r.getHTTP('/api/compiles', {})
    assert.equal( res, `{}` )
  })

  it( 'get all compiles', async () => {
    setImmutableKey('/compiles/FirstContract', new Map({}))
    setImmutableKey('/compiles/SecondContract', new Map({}))
    const res = await r.getHTTP('/api/compiles', {})
    assert.equal( res, '{"FirstContract":{},"SecondContract":{}}')
  })
  
  after(async () => {
    fs.unlinkSync(path.join(DB_DIR, 'test.json'))
    fs.unlinkSync(path.join(DB_DIR, COMPILES_DIR, 'FirstContract.json'))
    fs.unlinkSync(path.join(DB_DIR, COMPILES_DIR, 'SecondContract.json'))
    server.stop()
  })

})

