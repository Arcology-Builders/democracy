#!/usr/bin/env node

// Run as
// NODE_ENV=TEST node bin/simple.js
// A simple script to test a production-style departure
// outside of a unit test using .env and TEST.DEPLOYER_ADDRESS

const { Map } = require('immutable')
const { Logger } = require('demo-utils')
const LOGGER = new Logger('bin/simple')
const { deployerMixin, compileMixin, departMixin, argListMixin, run } = require('..')
const m0 = argListMixin(Map({
  'anotherThing': 'foo',
  unlockSeconds: 10,
  sourcePathList: ['../test-contracts/contracts'],
}))
const m1 = deployerMixin(Map({}))
const m2 = compileMixin(Map({}))
const m3 = departMixin(Map({
  name: 'Simple departure',
}))
const departFunc = async (state) => {
  const { compile, link, deploy, bm, deployerEth, deployerAddress, anotherThing } = state.toJS()
  LOGGER.info(`Prepared signer at address ${deployerAddress}`)
  LOGGER.info(`And another thing ${anotherThing}`)
  await compile( 'DifferentSender', 'DifferentSender.sol' )
  await link( 'DifferentSender', 'link' )
  const ds = await deploy( 'DifferentSender', 'link', 'deploy' )
  LOGGER.info(`Deployed DifferentSender at ${ds.get('deployAddress')}`)
}

run( m0, m1, m2, m3, departFunc )
