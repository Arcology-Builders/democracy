'use strict'
const fs    = require('fs')
const path  = require('path')
const utils = require('demo-utils')

const { DB_DIR, COMPILES_DIR, LINKS_DIR, DEPLOYS_DIR, Logger } = utils
const LOGGER = new Logger('remote.spec')
const { isCompile, isLink, isDeploy } = require('demo-contract')
const { Map } = require('immutable')
const chai = require('chai')
const expect = require('chai').expect
const assert = chai.assert
chai.use(require('chai-as-promised'))

const { RESTServer } = require('demo-rest')
const { depart } = require('..')

describe( 'Remote departures', () => {
  
  let eth = utils.getNetwork()
  let chainId
  let accounts
  let cleaner
  let result
  let bm
  const s = new RESTServer(6969, true)
  s.start()

  before(async () => {
   accounts = await eth.accounts()
   chainId = await eth.net_version()
  })

  it( 'executing a remote departure', async () => {
    result = await depart({
      name: "remote-departure",
      address: accounts[1],
      sourcePath: "../../node_modules/demo-test-contracts/contracts",
      bmHostName: "arcology.nyc",
      bmPort: 7000,
      callback: async ({compile, link, deploy, bm}) => {
        
        //LOGGER.info( 'Compiling', Date.now() )
        const cout = await compile( 'DifferentSender', 'DifferentSender.sol' )
        assert(isCompile(cout),
               `Compiling output invalid: ${JSON.stringify(cout.toJS())}`)
        
        //LOGGER.info( 'Linking', Date.now() )
        const lout = await link( 'DifferentSender', 'link' )
        assert(isLink(lout),
               `Linking output invalid: ${JSON.stringify(lout.toJS())}`)
        assert( isLink( await bm.getLink('DifferentSender-link')) )

        //LOGGER.info( 'Deploying', Date.now() )
        const dout = await deploy( 'DifferentSender', 'link', 'deploy', new Map({}), true )
        assert(isDeploy(dout),
               `Deploying output invalid: ${JSON.stringify(dout.toJS())}`)
        return true
      }
    })
    bm = result.bm
    assert(Map.isMap(result.compiles))
    assert(Map.isMap(result.links))
    assert(Map.isMap(result.deploys))
    assert.typeOf(result.result, 'boolean')
    assert(result.result)
    assert.typeOf(result.cleaner, 'function')
    // Unfortunately, these local builds get left behind by the concurrent depart.spec.js
    //assert.notOk(fs.existsSync(path.join(DB_DIR, COMPILES_DIR, 'DifferentSender.json')))
    //assert.notOk(fs.existsSync(path.join(DB_DIR, LINKS_DIR, 'DifferentSender-link.json')))
    //assert.notOk(fs.existsSync(path.join(DB_DIR, DEPLOYS_DIR, chainId, 'DifferentSender-deploy.json')))
  })

  it( 'remote link is available', async () => {
    const link = await bm.getLink('DifferentSender-link')
    assert(isLink(link), `Link DifferentSender-link not found`)
  })

  it( 'remote deploy is available', async () => {
    const deploy = await bm.getDeploy('DifferentSender-deploy')
    assert(isDeploy(deploy), `Deploy DifferentSender-deploy not found`)
  })

  it( 'remote cleaning is not possible', async () => {
    await expect ( result.cleaner() ).to.be.rejectedWith(Error)
  })

  s.stop()

})
