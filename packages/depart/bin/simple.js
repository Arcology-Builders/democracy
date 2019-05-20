#!/usr/bin/env node

// Run as
// NODE_ENV=TEST node bin/simple.js
// A simple script to test a production-style departure
// outside of a unit test using .env and TEST.DEPLOYER_ADDRESS

const { Logger } = require('demo-utils')
const LOGGER = new Logger('bin/simple')
const { deployerMixin, departMixin, argListMixin, run } = require('..')

const m0 = argListMixin(['anotherThing'])
const m1 = deployerMixin({ unlockSeconds: 10 })
const m2 = departMixin({
  name: 'Simple departure',
  sourcePath: '../../node_modules/demo-test-contracts/contracts',
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

run( departFunc, [ m0, m1, m2 ] )
