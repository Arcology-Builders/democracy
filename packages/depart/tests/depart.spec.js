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
const { run, argListMixin, compileMixin, deployerMixin, departMixin } = require('..')

describe( 'Departures', () => {
  
  let eth = getNetwork()
  let chainId
  let accounts
  let finalState

  const m0 = argListMixin( Map({
    unlockSeconds   : 30,
    testValueETH    : '0.1',
    testAccountIndex: 0,
    name            : "simple-departure",
    autoConfig      : false,
    sourcePathList  : ["../../node_modules/demo-test-contracts/contracts"],
  })
  )
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
      const { compile, link, deploy, bm } = state.toJS() 
      const cout = await compile( 'DifferentSender', 'DifferentSender.sol' )
      assert( isCompile(cout) )
      const contract = await bm.getContract( 'DifferentSender' )
      assert( isContract(contract) )
      assert( immEqual(contract, cout.get('DifferentSender')) )

      assert( bm.inputter == getImmutableKey )
      assert( bm.outputter == setImmutableKey )

      const lout = await link( 'DifferentSender', 'link' )
      assert( isLink(lout) )
      const rLink = await bm.getLink('DifferentSender-link')
      assert( immEqual(lout, rLink) )
      
      const dout = await deploy( 'DifferentSender', 'link', 'deploy', new Map({}), true )
      const rDeploy = await bm.getDeploy('DifferentSender-deploy')
      assert( isDeploy(dout) )
      assert( immEqual(dout, rDeploy) )
      return new Map({ 'result': true })
    }

    finalState = (await run( m0, m1, m2, m3, departFunc )).toJS()
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
    await finalState.cleanCompiles()
  })

  it( 'cleaning happens', async () => {
    assert.notOk(fs.existsSync(path.join(DB_DIR, COMPILES_DIR, 'DifferentSender.json')))
    assert.notOk(fs.existsSync(path.join(DB_DIR, LINKS_DIR, 'DifferentSender-link.json')))
    assert.notOk(fs.existsSync(path.join(DB_DIR, DEPLOYS_DIR, 'DifferentSender-deploy.json')))
  })

  after(() => {
    wallet.shutdownSync()
  })
})
