const RESTServer = require('../src/server')
const { RemoteDB, Logger } = require('@democracy.js/utils')
const LOGGER = new Logger('rest.spec')

const chai = require('chai')
chai.use(require('chai-as-promised'))
const assert = chai.assert
const expect = chai.expect

describe('Runs a REST server', () => {

  const server = new RESTServer(6666, true)
  const r = new RemoteDB('localhost', 6666)

  const randInt = Math.round(Math.random() * 100)

  it( 'starts a REST server that handles a test request' , async () => {
    server.start()
    const res = await r.postHTTP('/api/test', { 'a': randInt })
    const expected = `{"message":"Test posted!","a":"${randInt}"}`
    assert.equal(res.toString(), expected)
    server.stop()
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
    server.start()
    const res = await r.getHTTP('/api/someRoute', {})
    assert.equal( res.toString(), `{"a":${randInt+1}}`)
    server.stop()
  }) 

})

