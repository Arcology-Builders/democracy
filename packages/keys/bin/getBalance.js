#!/usr/bin/env node
'use strict'

const { getNetwork, getConfig } = require('demo-utils')
const { fromWei } = require('ethjs-unit')

const eth = getNetwork()

const address = process.argv[2] || getConfig()['DEPLOYER_ADDRESS']

const mainFunc = async () => {
  const chainId = await eth.net_version()
  console.log(`Balance of ${address} on chain ${chainId}`)
  const balance = await eth.getBalance(address)
  console.log(`${fromWei(balance)} ETH`)
}

mainFunc()
