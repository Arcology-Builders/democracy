const fs     = require('fs')
const path   = require('path')

const { RemoteDB, Logger, setImmutableKey, setFS, setPath, getNetwork,
  DB_DIR, COMPILES_DIR, LINKS_DIR, DEPLOYS_DIR } = require('@democracy.js/utils')
setFS(fs)
setPath(path)

const chai   = require('chai')
chai.use(require('chai-as-promised'))
const assert = chai.assert
const expect = chai.expect
const { Map } = require('immutable')

const RESTServer = require('../src/server')
const LOGGER     = new Logger('rest.spec')

describe( 'Remote builds ', () => {

  const server = new RESTServer(6667, true)
  const r = new RemoteDB('localhost', 6667)

  const randInt = Math.round(Math.random() * 100)
  let networkId

  before(async () => {
    server.start()
    const eth = getNetwork()
    networkId = await eth.net_version()
  })

  it( 'starts a REST server that handles a test request' , async () => {
    const res = await r.postHTTP('/api/test', { 'a': randInt })
    const expected = `{"message":"Test posted!","a":${randInt}}`
    assert.equal(res, expected)
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
    assert.equal( res, `{"a":${randInt+1}}`)
  }) 
  
  it( 'get all empty compiles', async () => {
    const res = await r.getHTTP('/api/compiles', {})
    assert.equal( res, `{}`)
  })

  it( 'get all compiles', async () => {
    setImmutableKey('/compiles/FirstContract', new Map({}))
    setImmutableKey('/compiles/SecondContract', new Map({}))
    const res = await r.getHTTP('/api/compiles', {})
    assert.equal( res, '{"FirstContract":{},"SecondContract":{}}')
  })

  it( 'get all empty links', async () => {
    const res = await r.getHTTP('/api/links', {})
    assert.equal( res, `{}`)
  })

  it( 'get all links', async () => {
    setImmutableKey('/links/FirstLink', new Map({}))
    setImmutableKey('/links/SecondLink', new Map({}))
    const res = await r.getHTTP('/api/links', {})
    assert.equal( res, '{"FirstLink":{},"SecondLink":{}}')
  })

  it( 'get all empty deploys', async () => {
    const res = await r.getHTTP(`/api/deploys/${networkId}`, {})
    assert.equal( res, `{}`)
  })
  
  it( 'get all deploys', async () => {
    setImmutableKey(`/deploys/${networkId}/FirstDeploy`, new Map({}))
    setImmutableKey(`/deploys/${networkId}/SecondDeploy`, new Map({}))
    const res = await r.getHTTP(`/api/deploys/${networkId}`, {})
    assert.equal( res, '{"FirstDeploy":{},"SecondDeploy":{}}')
  })

  after(async () => {
    fs.unlinkSync(path.join(DB_DIR, COMPILES_DIR, 'FirstContract.json'))
    fs.unlinkSync(path.join(DB_DIR, COMPILES_DIR, 'SecondContract.json'))
    fs.unlinkSync(path.join(DB_DIR, LINKS_DIR   , 'FirstLink.json'))
    fs.unlinkSync(path.join(DB_DIR, LINKS_DIR   , 'SecondLink.json'))
    fs.unlinkSync(path.join(DB_DIR, DEPLOYS_DIR , networkId, 'FirstDeploy.json'))
    fs.unlinkSync(path.join(DB_DIR, DEPLOYS_DIR , networkId, 'SecondDeploy.json'))
    server.stop()
  })

})

