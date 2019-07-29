#!/usr/bin/env node
'use strict'
const { Logger, fromJS, toJS, getNetwork, getConfig } = require('demo-utils')
const { Deployer } = require('demo-contract')
const { wallet } = require('demo-keys')
const LOGGER = new Logger('bin/deployer')
const { toWei } = require('ethjs-unit')

const main = async({ contractName, linkId, deployId }) => {
  const eth     = getNetwork()
  const chainId = await eth.net_version()
  const deployerAddress = getConfig()['DEPLOYER_ADDRESS']
  const deployerPassword = getConfig()['DEPLOYER_PASSWORD']

  await wallet.init({unlockSeconds: 2})
  const { signerEth } = await wallet.prepareSignerEth({
    address: deployerAddress,
    password: deployerPassword,
  })
  const accounts = await eth.accounts()
  await wallet.payTest({
    fromAddress : accounts[0],
    toAddress   : deployerAddress,
    weiValue    : toWei('0.1', 'ether'),
  })

  const d       = new Deployer({
    chainId : chainId,
    address : getConfig()['DEPLOYER_ADDRESS'],
    eth     : signerEth,
  })
  const bm         = d.getBuildsManager()
  const contracts  = await bm.getContracts()
  LOGGER.info("Compiles", contracts)
  const result     = await d.deploy(contractName, linkId, deployId)
  LOGGER.info(result)
  wallet.shutdownSync()
}

if (require.main === module) {
  LOGGER.info(process.argv)
  main({
    contractName : process.argv[2],
    linkId       : process.argv[3],
    deployId     : process.argv[4],
  })
  .then(() => console.log("Deploy complete"))
  .catch((e) => {
    LOGGER.error(JSON.stringify(e, Object.getOwnPropertyNames(e)))
    process.exit(1)
  } )
}
