'use strict'
const fs    = require('fs')
const path  = require('path')

const { Map } = require('immutable')
const chai    = require('chai')
const expect  = require('chai').expect
const assert  = chai.assert
chai.use(require('chai-as-promised'))

const { toWei } = require('web3-utils')
const utils = require('demo-utils')
const { DB_DIR, COMPILES_DIR, LINKS_DIR, DEPLOYS_DIR, Logger } = utils
const LOGGER = new Logger('remote.spec')

const { wallet } = require('demo-keys')
const { isCompile, isLink, isDeploy } = require('demo-contract')
const { RESTServer } = require('demo-rest')
const { depart } = require('..')

describe( 'Remote departures', () => {
  
  let eth = utils.getNetwork()
  let chainId
  let accounts
  let cleaner
  let result
  let bm
  //const deployerAddress = utils.getConfig()['DEPLOYER_ADDRESS']
  //const deployerPassword = utils.getConfig()['DEPLOYER_PASSWORD']
  let deployerAddress
  let deployerPassword
  let deployerEth
  const s = new RESTServer(6969, true)
  s.start()

  before(async () => {
    chainId = await eth.net_version()
    const testAccounts = await eth.accounts()

    await wallet.init({ autoConfig: true, unlockSeconds: 10 })

    // We create the spenderEth here and not in the departure
    // because we need to fund it from test accounts 
    const result = await wallet.createSpenderEth({
      autoConfig : true,
      autoCreate : true,
      autoInit   : false,
    })
    deployerAddress = result.address
    deployerPassword = result.password
    LOGGER.debug('Deployer Address and Password', deployerAddress, deployerPassword)
    deployerEth = result.spenderEth
    await wallet.payTest({
      fromAddress: testAccounts[5],
      toAddress: deployerAddress,
      weiValue: toWei('0.1', 'ether'),
    }) 
  })

  it( 'executing a remote departure', async () => {
    result = await depart({
      name            : "remote-departure",
      autoConfig      : true,
      deployerEth     : deployerEth,
      deployerAddress : deployerAddress,
      sourcePath      : "../../node_modules/demo-test-contracts/contracts",
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
