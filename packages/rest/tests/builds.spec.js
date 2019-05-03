const path = require('path')
const utils = require('demo-utils')
const { setImmutableKey, getNetwork, DB_DIR, COMPILES_DIR, LINKS_DIR, DEPLOYS_DIR } = utils
const chai   = require('chai')
chai.use(require('chai-as-promised'))
const assert = chai.assert
const expect = chai.expect
const { Map } = require('immutable')

assert(utils.rimRafFileSync)
const { RESTServer } = require('..')
const { RemoteDB }   = require('demo-client')
const LOGGER         = new utils.Logger('rest.spec')

const { delayedGet } = require('demo-client')

describe( 'Remote builds ', () => {

  const server = new RESTServer(6668, true)
  const r = new RemoteDB('localhost', 6668)

  const randInt = Math.round(Math.random() * 100)
  const eth = getNetwork()
  let chainId

  before(async () => {
    server.start()
    chainId = await eth.net_version()
    utils.rimRafFileSync(path.join(DB_DIR, COMPILES_DIR, 'FirstContract.json'))
    utils.rimRafFileSync(path.join(DB_DIR, COMPILES_DIR, 'SecondContract.json'))
    utils.rimRafFileSync(path.join(DB_DIR, LINKS_DIR   , 'FirstLink.json'))
    utils.rimRafFileSync(path.join(DB_DIR, LINKS_DIR   , 'SecondLink.json'))
    utils.rimRafFileSync(path.join(DB_DIR, DEPLOYS_DIR , chainId, 'FirstDeploy.json'))
    utils.rimRafFileSync(path.join(DB_DIR, DEPLOYS_DIR , chainId, 'SecondDeploy.json'))
  })

  it( 'starts a REST server that handles a test request' , async () => {
    const res = await r.postHTTP('/api/test/builds', { 'a': randInt }, true)
    const expected = `{"message":"Test posted!","a":${randInt}}`
    assert.equal(res, expected)
  })

  it( 'posting to a non-listening server times out and fails' , async () => {
    //await expect( r.postHTTP('/api/test', { 'a': randInt }) )
    //  .to.be.rejectedWith(Error)
    return r.postHTTP('/api/test/builds', { 'a': randInt }, true)
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
    await delayedGet(r.getHTTP.bind(r, '/api/someRoute'), `{"a":${randInt+1}}`, LOGGER)
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
    const result = await r.postHTTP('/api/links/FirstLink', new Map({'a':1}))
    assert.equal(result, '{"result":true,"body":{"a":1}}')
    const result2 = await r.postHTTP('/api/links/SecondLink', new Map({'b': 2}))
    assert.equal(result2, '{"result":true,"body":{"b":2}}')
    const res = await r.getHTTP('/api/links', {})
    assert.equal( res, '{"FirstLink":{"a":1},"SecondLink":{"b":2}}')
  })

  it( 'fail to overwrite a link', async () => {
    await r.postHTTP('/api/links/FirstLink', new Map({'c':3}))
      .then((val) => assert.fail("Should not have been able to overwrite /api/links/FirstLink"))
      .catch((err) => LOGGER.info("Correctly failed to overwrite link /api/links/FirstLink"))
    // expect (await r.postHTTP('/api/link/FirstLink', new Map({'c':3})))
    //   .to.be.rejectedWith(Error)
  })

  it( 'succeeds in overwriting a link', async () => {
    const result = await r.postHTTP('/api/links/FirstLink', new Map({'d':4}), true)
    await delayedGet(r.getHTTP.bind(r, '/api/links/FirstLink'), '{"d":4}')
  })

  it( 'get all empty deploys', async () => {
    const res = await r.getHTTP(`/api/deploys/${chainId}`, {})
    assert.equal( res, `{}`)
  })
  
  it( 'get all deploys', async () => {
    r.postHTTP(`/api/deploys/${chainId}/FirstDeploy`, new Map({'z':22}))
    r.postHTTP(`/api/deploys/${chainId}/SecondDeploy`, new Map({'y':23}))
    await delayedGet(r.getHTTP.bind(r, `/api/deploys/${chainId}`),
                     '{"FirstDeploy":{"z":22},"SecondDeploy":{"y":23}}')
  })

  it( 'get deploy', async () => {
    const res = await r.getHTTP(`/api/deploys/${chainId}/FirstDeploy`, {})
  })

  it( 'fail to overwrite a deploy', async () => {
    const result =  await r.postHTTP(`/api/deploys/${chainId}/FirstDeploy`, new Map({'x':21}))
    assert.equal(result, '{"result":false,"error":{}}')
      //await expect (
      //  await r.postHTTP(`/api/deploy/${chainId}/FirstDeploy`, new Map({'x':21}))
      //).to.be.rejectedWith(Error)
  })

  it( 'succeeds in overwriting a deploy', async () => {
    await r.postHTTP(`/api/deploys/${chainId}/FirstDeploy`, new Map({'x':4}), true)
    const res = await r.getHTTP(`/api/deploys/${chainId}/FirstDeploy`, {})
    assert.equal( res, '{"x":4}')
  })

  after( () => {
  server.stop()
    utils.rimRafFileSync(path.join(DB_DIR, COMPILES_DIR, 'FirstContract.json'))
    utils.rimRafFileSync(path.join(DB_DIR, COMPILES_DIR, 'SecondContract.json'))
    utils.rimRafFileSync(path.join(DB_DIR, LINKS_DIR   , 'FirstLink.json'))
    utils.rimRafFileSync(path.join(DB_DIR, LINKS_DIR   , 'SecondLink.json'))
    utils.rimRafFileSync(path.join(DB_DIR, DEPLOYS_DIR , chainId, 'FirstDeploy.json'))
    utils.rimRafFileSync(path.join(DB_DIR, DEPLOYS_DIR , chainId, 'SecondDeploy.json'))
  })

})

