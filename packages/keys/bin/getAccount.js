#!/usr/bin/env node
'use strict'

const { getNetwork, getConfig } = require('demo-utils')
const { wallet } = require('demo-keys')

const eth = getNetwork()

const address  = process.argv[2] || getConfig()['DEPLOYER_ADDRESS']
// TODO Prompt for password without echoing characters to prompt
const password = process.argv[3] || getConfig()['DEPLOYER_PASSWORD']

const mainFunc = async () => {
  await wallet.init({ autoConfig: true, unlockSeconds: 10 })
  await wallet.prepareSignerEth({ address: address, password: password })
  console.log(JSON.stringify(wallet.getAccountSync(address), null, '  '))
  wallet.shutdownSync()
}

mainFunc()
