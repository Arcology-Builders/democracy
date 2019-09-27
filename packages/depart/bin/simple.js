#!/usr/bin/env node

// Run as
// NODE_ENV=TEST node bin/simple.js
// A simple script to test a production-style departure
// outside of a unit test using .env and TEST.DEPLOYER_ADDRESS

const { Map } = require('immutable')
const { Logger } = require('demo-utils')
const LOGGER = new Logger('bin/simple')
const { deployerMixin, argListMixin, run } = require('demo-transform')
const { departMixin } = require('..')

const m0 = argListMixin(Map({
  anotherThing: '',
  unlockSeconds: 3,
  sourcePathList: ['../../node_modules/demo-test-contracts/contracts', 'contracts'],
}))
const m1 = deployerMixin({ unlockSeconds: 10 })
const m2 = departMixin({
  name: 'Simple departure',
})
const departFunc = async (state) => {
  const { compile, link, deploy, bm, deployerEth, deployerAddress, anotherThing } = state.toJS()
  LOGGER.info(`Prepared signer at address ${deployerAddress}`)
  LOGGER.info(`And another thing ${anotherThing}`)
  await compile( 'DifferentSender', 'DifferentSender.sol' )
  await link( 'DifferentSender', 'link' )
  const ds = await deploy( 'DifferentSender', 'link', 'deploy' )
  LOGGER.info(`Deployed DifferentSender at ${ds.get('deployAddress')}`)
}

run( [ m0, m1, m2, departFunc ] )
