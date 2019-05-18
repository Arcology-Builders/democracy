'use strict'
const fs        = require('fs')
const path      = require('path')
const { Map }   = require('immutable')
const assert    = require('chai').assert
const { toWei } = require('web3-utils')

const utils = require('demo-utils') 
const { DB_DIR, COMPILES_DIR, LINKS_DIR, DEPLOYS_DIR, getNetwork, immEqual, Logger } = utils
const LOGGER = new Logger('depart.spec')
const { isContract, isCompile, isLink, isDeploy } = require('demo-contract')
const { getImmutableKey, setImmutableKey } = require('demo-utils')

const { wallet } = require('demo-keys')
const { run, deployerMixin, departMixin } = require('..')

describe( 'Departures', () => {
  
  let eth = getNetwork()
  let chainId
  let accounts
  let finalState

  before(async () => {
    accounts = await eth.accounts()
    LOGGER.debug('before')
    chainId = await eth.net_version()

    // Fund deployerAddress from test wallet
    await wallet.payTest({
     weiValue    : toWei('0.1', 'ether'),
     fromAddress : accounts[0],
     toAddress   : utils.getConfig()['DEPLOYER_ADDRESS'],
     label       : 'funding from test account',
    })
  })

  it( 'executes a simple departure', async () => { 
    const m1 = deployerMixin({ unlockSeconds: 15 })
    const m2 = departMixin({
      name            : "simple-departure",
      autoConfig      : false,
      sourcePath      : "../../node_modules/demo-test-contracts/contracts",
    })
    const departFunc = async (state) => {
      const { compile, link, deploy, bm } = state.toJS() 
      LOGGER.info( 'Compiling', Date.now() )
      const cout = await compile( 'DifferentSender', 'DifferentSender.sol' )
      assert( isCompile(cout) )
      const contract = await bm.getContract( 'DifferentSender' )
      assert( isContract(contract) )
      assert( immEqual(contract, cout.get('DifferentSender')) )

      assert( bm.inputter == getImmutableKey )
      assert( bm.outputter == setImmutableKey )

      LOGGER.info( 'Linking', Date.now() )
      const lout = await link( 'DifferentSender', 'link' )
      assert( isLink(lout) )
      const rLink = await bm.getLink('DifferentSender-link')
      assert( immEqual(lout, rLink) )
      
      LOGGER.info( 'Deploying', Date.now() )
      const dout = await deploy( 'DifferentSender', 'link', 'deploy', new Map({}), true )
      const rDeploy = await bm.getDeploy('DifferentSender-deploy')
      assert( isDeploy(dout) )
      assert( immEqual(dout, rDeploy) )
      return new Map({ 'result': true })
    }

    finalState = (await run( departFunc, [ m1, m2 ] )).toJS()
    LOGGER.debug('finalState', finalState) 
    assert(Map.isMap(finalState.getCompiles()))
    assert(Map.isMap(finalState.getLinks()))
    assert(Map.isMap(finalState.getDeploys()))
    assert.typeOf(finalState.result, 'boolean')
    assert(finalState.result === true) 
    assert.typeOf(finalState.clean, 'function')
    assert(fs.existsSync(path.join(DB_DIR, COMPILES_DIR, 'DifferentSender.json')))
    assert(fs.existsSync(path.join(DB_DIR, LINKS_DIR, 'DifferentSender-link.json')))
    assert(fs.existsSync(path.join(DB_DIR, DEPLOYS_DIR, chainId, 'DifferentSender-deploy.json')))
  })

  it( 'cleans', async () => {
    await finalState.clean()
  })

  it( 'cleaning happens', async () => {
    assert.notOk(fs.existsSync(path.join(DB_DIR, COMPILES_DIR, 'DifferentSender.json')))
    assert.notOk(fs.existsSync(path.join(DB_DIR, LINKS_DIR, 'DifferentSender-link.json')))
    assert.notOk(fs.existsSync(path.join(DB_DIR, DEPLOYS_DIR, 'DifferentSender-deploy.json')))
  })

})
