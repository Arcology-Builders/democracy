'use strict'
const fs        = require('fs')
const path      = require('path')
const { Map }   = require('immutable')
const assert    = require('chai').assert
const { toWei } = require('ethjs-unit')

const utils = require('demo-utils') 
const { DB_DIR, COMPILES_DIR, LINKS_DIR, DEPLOYS_DIR, getNetwork, immEqual, Logger } = utils
const LOGGER = new Logger('depart.spec')
const { isContract, isCompile, isLink, isDeploy } = require('demo-contract')
const { getImmutableKey, setImmutableKey } = require('demo-utils')
const { createCompiler } = require('demo-compile')

const { wallet } = require('demo-keys')
const { run, argListMixin, bmMixin, compileMixin, deployerMixin, departMixin,
  createEmptyCompiler } = require('..')

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
  const m2 = bmMixin()
  const m3 = departMixin()
  const departFunc = async (state) => {
    const { compile, deployed } = state.toJS() 

    await compile( 'DifferentSender', 'DifferentSender.sol' )
    const ds = await deployed( 'DifferentSender' )
    return new Map({ 'result': true })
  }

  before(async () => {
    accounts = await eth.accounts()
    LOGGER.debug('before')
    chainId = await eth.net_version()
  })

  it( 'executes a departure with/without a compile', async () => { 
    const startTime = Date.now()
    finalState = (await run( m0, m1, m2, compileMixin(createCompiler), m3, departFunc )).toJS()
    assert(finalState['result'])
    const elapsedTime = Date.now() - startTime
    LOGGER.info('Elapsed time with compile', elapsedTime)
    const startTime2 = Date.now()
    finalState2 = (await run( m0, m1, m2, compileMixin(createEmptyCompiler), m3, departFunc )).toJS()
    assert(finalState2['result'])
    const elapsedTime2 = Date.now() - startTime2
    LOGGER.info('Elapsed time without compile', elapsedTime2)
  })

  after(async () => {
    await finalState.clean()
    await finalState.cleanCompiles()
    //await finalState2.clean()
    wallet.shutdownSync()
  })
})
