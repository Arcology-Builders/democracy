#!/usr/bin/env node

// Fund an existing account from a test account

const assert = require('chai').assert
const { getConfig, getNetwork } = require('demo-utils')
const { wallet } = require('demo-keys')
const { toWei } = require('web3-utils')

const mainFunc = async (fundFromTest) => {

  const eth = getNetwork()
  const accounts = await eth.accounts()
  const deployerAddress  = (fundFromTest) ? accounts[0] : getConfig()['DEPLOYER_ADDRESS']
  const deployerPassword = getConfig()['DEPLOYER_PASSWORD']

  console.log('Deployer Address', deployerAddress)
  console.log('Deployer Password', deployerPassword)

  console.log('Paying 0.1 ETH...')
  await wallet.payTest({
    fromAddress: accounts[0],
    toAddress: address,
    weiValue: toWei('0.1', 'ether'),
  })
  console.log('Paying complete.')
}

mainFunc().then(() => console.log("That's all folks"))
