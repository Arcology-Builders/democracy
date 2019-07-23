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
  let finalState2

  const m0 = argListMixin( Map({
    unlockSeconds   : 20,
    testValueETH    : '0.1',
    testAccountIndex: 0,
    name            : "simple-departure",
    autoConfig      : false,
    sourcePathList  : ["../../node_modules/demo-test-contracts/contracts"],
  })
  )
  const m1 = deployerMixin()
  const m3 = departMixin()

  before(async () => {
    accounts = await eth.accounts()
    LOGGER.debug('before')
    chainId = await eth.net_version()
  })

  it( 'executes a departure with/without a compile', async () => { 
    const departFunc = async (state) => {
      const { compile, deployed } = state.toJS() 

      await compile( 'DifferentSender', 'DifferentSender.sol' )
      const ds = await deployed( 'DifferentSender' )
      return new Map({ 'result': true })
    }

    const startTime = Date.now()
    finalState = (await run( m0, m1, compileMixin(true), m3, departFunc )).toJS()
    assert(finalState['result'])
    const elapsedTime = Date.now() - startTime
    LOGGER.info('Elapsed time with compile', elapsedTime)

    const departFunc2 = async (state) => {
      const { deployed } = state.toJS() 

      const ds = await deployed( 'DifferentSender' )
      return new Map({ 'result': true })
    }
    const startTime2 = Date.now()
    finalState2 = (await run( m0, m1, compileMixin(false), m3, departFunc2 )).toJS()
    assert(finalState2['result'])
    const elapsedTime2 = Date.now() - startTime2
    LOGGER.info('Elapsed time without compile', elapsedTime2)
  })

  it( 'cleans', async () => {
    await finalState.clean()
    await finalState.cleanCompiles()
    await finalState2.clean()
  })

  after((done) => {
    wallet.shutdownSync()
    done()
  })
})
