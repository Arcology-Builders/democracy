'use strict'
const fs        = require('fs')
const path      = require('path')
const { Map }   = require('immutable')
const assert    = require('chai').assert
const { toWei } = require('web3-utils')
const BN        = require('bn.js')

const utils = require('demo-utils') 
const { DB_DIR, COMPILES_DIR, LINKS_DIR, DEPLOYS_DIR, getNetwork, immEqual, Logger } = utils
const LOGGER = new Logger('depart.spec')
const { Contract, isContract, isCompile, isLink, isDeploy } = require('demo-contract')
const { getImmutableKey, setImmutableKey, getConfig } = require('demo-utils')

const { wallet } = require('demo-keys')
const { run, argListMixin, compileMixin, deployerMixin, departMixin } = require('..')

describe( 'Departures', () => {
  
  let eth = getNetwork()
  let chainId
  let accounts
  let finalState

  const m0 = argListMixin(Map({
    unlockSeconds: 30, testValueETH: '0.1', testAccountIndex: 0,
    departName      : "relink",
    autoConfig      : true,
    sourcePathList  : ["contracts-new"],
  }))
  const m1 = deployerMixin()
  const m2 = compileMixin()
  const m3 = departMixin()

  before(async () => {
    accounts = await eth.accounts()
    LOGGER.debug('before')
    chainId = await eth.net_version()
  })

  it( 'executes a simple departure', async () => { 
    const departFunc = async (state) => {
      const { compile, link, deploy, deployed, deployerEth, minedTx,
        deployerAddress } = state.toJS() 

      // The old way: compiling, linking, deploying, getting a contract instance
      await compile( 'Relink', 'Relink.sol' )
      const lout = await link( 'Relink', 'link' )
      const dout = await deploy( 'Relink', 'link', 'deploy', new Map({}), true )
      const contract = new Contract({ deployerEth: deployerEth, deploy: dout })
      await contract.getInstance().outward(new BN(1234),
                                           { from: deployerAddress,
                                             gas: getConfig()['GAS_LIMIT'] })
      
      fs.renameSync('./contracts-new/Relink.sol', './contracts-new/Relink.sol.old')
      fs.renameSync('./contracts-new/Relink.sol.new', './contracts-new/Relink.sol')

      await compile( 'Relink', 'Relink.sol' )
      const lout2 = await link( 'Relink', 'link' )
      const dout2 = await deploy( 'Relink', 'link', 'deploy', new Map({}), true )
      assert.notOk( immEqual(lout, lout2), 'Links should be different before and after' )
      assert.notOk( immEqual(dout, dout2) )
      
      // The new way of compiling: deployed and minedTx
      const relink = await deployed( 'Relink' )
      await minedTx( relink.outward, [new BN(1234), true] )
      assert( new BN(1234).eq((await relink.a())['0']) )
      fs.renameSync('./contracts-new/Relink.sol', './contracts-new/Relink.sol.new')
      fs.renameSync('./contracts-new/Relink.sol.old', './contracts-new/Relink.sol')
      return new Map({ 'result': true })
    }

    finalState = (await run( m0, m1, m2, m3, departFunc )).toJS()
    return finalState
  })

  /*
  // No remote cleaning allowed
  it( 'cleans', async () => {
    await finalState.clean()
  })
   */

  it( 'cleaning happens', async () => {
    assert.notOk(fs.existsSync(path.join(DB_DIR, COMPILES_DIR, 'Relink.json')))
    assert.notOk(fs.existsSync(path.join(DB_DIR, LINKS_DIR, 'Relink-link.json')))
    assert.notOk(fs.existsSync(path.join(DB_DIR, DEPLOYS_DIR, 'Relink-deploy.json')))
  })

  after(() => {
    wallet.shutdownSync()
  })
})
