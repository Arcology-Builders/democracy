'use strict'
const fs    = require('fs')
const path  = require('path')
const utils = require('demo-utils')

const { DB_DIR, COMPILES_DIR, LINKS_DIR, DEPLOYS_DIR, getNetwork, immEqual, Logger } = utils
const LOGGER = new Logger('depart.spec')
const { isContract, isCompile, isLink, isDeploy } = require('demo-contract')
const { getImmutableKey, setImmutableKey } = require('demo-utils')
const { Map } = require('immutable')
const assert = require('chai').assert
const { toWei } = require('web3-utils')

const { wallet } = require('demo-keys')
const { depart } = require('..')

describe( 'Departures', () => {
  
  let eth = getNetwork()
  let chainId
  let accounts
  let cleaner
  let result

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
    result = await depart({
      name            : "simple-departure",
      autoConfig      : false,
      sourcePath      : "../../node_modules/demo-test-contracts/contracts",
      callback        : async ({ compile, link, deploy, bm }) => {
        
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
       
        return true
      }
    })
    assert(Map.isMap(result.compiles))
    assert(Map.isMap(result.links))
    assert(Map.isMap(result.deploys))
    assert.typeOf(result.result, 'boolean')
    assert(result.result)
    assert.typeOf(result.cleaner, 'function')
    assert(fs.existsSync(path.join(DB_DIR, COMPILES_DIR, 'DifferentSender.json')))
    assert(fs.existsSync(path.join(DB_DIR, LINKS_DIR, 'DifferentSender-link.json')))
    assert(fs.existsSync(path.join(DB_DIR, DEPLOYS_DIR, chainId, 'DifferentSender-deploy.json')))
  })

  it( 'cleans', async () => {
    await result.cleaner()
  })

  it( 'cleaning happens', async () => {
    assert.notOk(fs.existsSync(path.join(DB_DIR, COMPILES_DIR, 'DifferentSender.json')))
    assert.notOk(fs.existsSync(path.join(DB_DIR, LINKS_DIR, 'DifferentSender-link.json')))
    assert.notOk(fs.existsSync(path.join(DB_DIR, DEPLOYS_DIR, 'DifferentSender-deploy.json')))
  })

})
