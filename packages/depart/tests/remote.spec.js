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
const { getImmutableKey, setImmutableKey } = utils
const LOGGER = new Logger('remote.spec')

const { wallet } = require('demo-keys')
const { isCompile, isLink, isDeploy } = require('demo-contract')
const { RESTServer } = require('demo-rest')
const { DEMO_TYPES: TYPES } = require('demo-transform')
const { createTransform } = require('demo-state')
const { departTransform } = require('..')
const { runStandardTransforms } = require('./common')

describe( 'Remote departures', () => {
  
  let eth = utils.getNetwork()
  let chainId
  let testAccounts
  let cleaner
  let finalState
  let bm
  let deployerAddress
  let deployerPassword
  let deployerEth
  const s = new RESTServer(6969, true)
  s.start()

  before(async () => {
    chainId = await eth.net_version()
    testAccounts = await eth.accounts()
    const departFunc = createTransform({
      func: async ({compile, link, deploy, bm, deployerEth, deployerAddress }) => {
				// We only need to do this here b/c tests are in NODE_ENV=DEVELOPMENT
				// In an actual departure this isn't necessary 
				await wallet.payTest({
					fromAddress : testAccounts[5],
					toAddress   : deployerAddress,
					weiValue    : toWei('0.1', 'ether'),
				}) 

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
				
				wallet.shutdownSync()
				return new Map({ result: true })
			},
      inputTypes: Map({
        compile         : TYPES['function'],
        link            : TYPES['function'],
        deploy          : TYPES['function'],
        bm              : TYPES.bm,
        deployerEth     : TYPES.ethereumSigner,
        deployerAddress : TYPES.ethereumAddress,
      }),
      outputTypes: Map({
        result          : TYPES.boolean,
      }),
    }) 

    finalState = await runStandardTransforms(
      departFunc,
      Map({
        testValueETH     : '0.1',
        testAccountIndex : 0,
        unlockSeconds    : 20,
        departName       : "remote-departure",
        autoConfig       : true,
        sourcePathList   : ["../../node_modules/demo-test-contracts/contracts"],
      })
    )
    bm = finalState.bm
/*
    await wallet.init({ autoConfig: true, unlockSeconds: 10 })

    // We create the spenderEth here and not in the departure
    // because we need to fund it from test accounts 
    const result = await wallet.prepareSignerEth({
      autoCreate : true,
    })
    deployerAddress = result.address
    deployerPassword = result.password
    LOGGER.debug('Deployer Address and Password', deployerAddress, deployerPassword)
    deployerEth = result.signerEth
   */
  })

  it( 'executing a remote departure', async () => {
    assert.notEqual(bm.inputter, getImmutableKey)
    assert.notEqual(bm.outputter, setImmutableKey)
    assert(Map.isMap(finalState.getCompiles()))
    assert(Map.isMap(finalState.getLinks()))
    assert(Map.isMap(finalState.getDeploys()))
    assert.typeOf(finalState.result, 'boolean')
    assert(finalState.result)
    assert.typeOf(finalState.clean, 'function')
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
    await expect ( finalState.clean() ).to.be.rejectedWith(Error)
  })

  s.stop()

})
