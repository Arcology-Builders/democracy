const path = require('path')
const utils = require('@democracy.js/utils')
utils.setFS(require('fs'))
utils.setPath(path)
const { setImmutableKey, getNetwork, DB_DIR, COMPILES_DIR, LINKS_DIR, DEPLOYS_DIR } = utils

const chai   = require('chai')
chai.use(require('chai-as-promised'))
const assert = chai.assert
const expect = chai.expect
const { Map } = require('immutable')

assert(utils.rimRafFileSync)
const { RESTServer } = require('../src/server')
const { RemoteDB } = require('../src/client')
const LOGGER     = new utils.Logger('rest.spec')

const { delayedGet, syncify } = require('./common')

describe( 'Remote builds ', () => {

  const server = new RESTServer(6667, true)
  const r = new RemoteDB('localhost', 6667)

  const randInt = Math.round(Math.random() * 100)
  let networkId

  before(async () => {
    server.start()
    const eth = getNetwork()
    networkId = await eth.net_version()
    utils.rimRafFileSync(path.join(DB_DIR, COMPILES_DIR, 'FirstContract.json'))
    utils.rimRafFileSync(path.join(DB_DIR, COMPILES_DIR, 'SecondContract.json'))
    utils.rimRafFileSync(path.join(DB_DIR, LINKS_DIR   , 'FirstLink.json'))
    utils.rimRafFileSync(path.join(DB_DIR, LINKS_DIR   , 'SecondLink.json'))
    utils.rimRafFileSync(path.join(DB_DIR, DEPLOYS_DIR , networkId, 'FirstDeploy.json'))
    utils.rimRafFileSync(path.join(DB_DIR, DEPLOYS_DIR , networkId, 'SecondDeploy.json'))
  })

  it( 'starts a REST server that handles a test request' , (done) => {
    syncify(async () => {
      const res = await r.postHTTP('/api/test', { 'a': randInt }, true)
      const expected = `{"message":"Test posted!","a":${randInt}}`
      assert.equal(res, expected)
    }, done)
  })

  it( 'posting to a non-listening server times out and fails' , (done) => {
    //await expect( r.postHTTP('/api/test', { 'a': randInt }) )
    //  .to.be.rejectedWith(Error)
    syncify(async() => {
      return r.postHTTP('/api/test', { 'a': randInt }, true)
      .then((v) => { assert.fail('Should have failed to connect to a non-existent server') })
      .catch((e) => {
        LOGGER.info('ERROR', e)
      })
    }, done) 
  })

  it( 'adds a new route', (done) => {
    syncify(async () => {
      const router = server.getRouter()
      router.route('/someRoute').get((req, res) => {
        res.json({ 'a': randInt+1 })
      })
      const res = await r.getHTTP('/api/someRoute', {})
      assert.equal( res, `{"a":${randInt+1}}`)
    }, done)
  }) 
  
  it( 'get all empty compiles', (done) => {
    syncify(async () => {
      const res = await r.getHTTP('/api/compiles', {})
      assert.equal( res, `{}`)
    }, done)
  })

  it( 'get all compiles', (done) => {
    syncify(async () => { 
      setImmutableKey('/compiles/FirstContract', new Map({}))
      setImmutableKey('/compiles/SecondContract', new Map({}))
      const res = await r.getHTTP('/api/compiles', {})
      assert.equal( res, '{"FirstContract":{},"SecondContract":{}}')
    }, done)
  })

  it( 'get all empty links', (done) => {
    syncify(async () => {
      const res = await r.getHTTP('/api/links', {})
      assert.equal( res, `{}`)
    }, done)
  })

  it( 'get all links', (done) => {
    syncify(async () => {
      const result = await r.postHTTP('/api/link/FirstLink', new Map({'a':1}))
      assert.equal(result, '{"result":true,"body":{"a":1}}')
      const result2 = await r.postHTTP('/api/link/SecondLink', new Map({'b': 2}))
      assert.equal(result2, '{"result":true,"body":{"b":2}}')
      const res = await r.getHTTP('/api/links', {})
      assert.equal( res, '{"FirstLink":{"a":1},"SecondLink":{"b":2}}')
    }, done)
  })

  it( 'fail to overwrite a link', (done) => {
    syncify(async () => {
      await r.postHTTP('/api/link/FirstLink', new Map({'c':3}))
        .then((val) => assert.fail("Should not have been able to overwrite /api/link/FirstLink"))
        .catch((err) => LOGGER.info("Correctly failed to overwrite link /api/link/FirstLink"))
    }, done) 
    // expect (await r.postHTTP('/api/link/FirstLink', new Map({'c':3})))
    //   .to.be.rejectedWith(Error)
  })

  it( 'succeeds in overwriting a link', (done) => {
    syncify(async () => {
      const result = await r.postHTTP('/api/link/FirstLink', new Map({'d':4}), true)
      await delayedGet(r.getHTTP.bind(r, '/api/link/FirstLink'), '{"d":4}')
    }, done)
  })

  it( 'get all empty deploys', (done) => {
    syncify(async() => {
      const res = await r.getHTTP(`/api/deploys/${networkId}`, {})
      assert.equal( res, `{}`)
    }, done)
  })
  
  it( 'get all deploys', (done) => {
    syncify(async() => {
      r.postHTTP(`/api/deploy/${networkId}/FirstDeploy`, new Map({'z':22}))
      r.postHTTP(`/api/deploy/${networkId}/SecondDeploy`, new Map({'y':23}))
      const res = await r.getHTTP(`/api/deploys/${networkId}`, {})
      assert.equal( res, '{"FirstDeploy":{"z":22},"SecondDeploy":{"y":23}}')
    }, done)
  })

  it( 'get deploy', (done) => {
    syncify(async () => {
      const res = await r.getHTTP(`/api/deploy/${networkId}/FirstDeploy`, {})
    }, done)
  })

  it( 'fail to overwrite a deploy', (done) => {
    syncify(async () => {
      const result =  await r.postHTTP(`/api/deploy/${networkId}/FirstDeploy`, new Map({'x':21}))
      assert.equal(result, '{"result":false,"error":{}}')
      //await expect (
      //  await r.postHTTP(`/api/deploy/${networkId}/FirstDeploy`, new Map({'x':21}))
      //).to.be.rejectedWith(Error)
    }, done)
  })

  it( 'succeeds in overwriting a deploy', (done) => {
    syncify(async () => {
      await r.postHTTP(`/api/deploy/${networkId}/FirstDeploy`, new Map({'x':4}), true)
      const res = await r.getHTTP(`/api/deploy/${networkId}/FirstDeploy`, {})
      assert.equal( res, '{"x":4}')
    }, done)
  })

  after( () => {
    utils.rimRafFileSync(path.join(DB_DIR, COMPILES_DIR, 'FirstContract.json'))
    utils.rimRafFileSync(path.join(DB_DIR, COMPILES_DIR, 'SecondContract.json'))
    utils.rimRafFileSync(path.join(DB_DIR, LINKS_DIR   , 'FirstLink.json'))
    utils.rimRafFileSync(path.join(DB_DIR, LINKS_DIR   , 'SecondLink.json'))
    utils.rimRafFileSync(path.join(DB_DIR, DEPLOYS_DIR , networkId, 'FirstDeploy.json'))
    utils.rimRafFileSync(path.join(DB_DIR, DEPLOYS_DIR , networkId, 'SecondDeploy.json'))
    server.stop()
  })

})

