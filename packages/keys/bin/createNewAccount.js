#!/usr/bin/env node

// Create a random new encrypted account on a remote DB
// and fund it either from a test account or
// from DEPLOYER_ADDRESS in your .env

const assert = require('chai').assert
const { getConfig, getNetwork } = require('demo-utils')
const { wallet } = require('demo-keys')
const { toWei } = require('web3-utils')

const mainFunc = async (fundFromTest) => {
  await wallet.init({ autoConfig: true, unlockSeconds: 1 })
  const { address, password } = await wallet.createEncryptedAccount()
  console.log('New Address' , address )
  console.log('New Password', password)

  const eth = getNetwork()
  const accounts = await eth.accounts()
  const deployerAddress  = (fundFromTest) ? accounts[0] : getConfig()['DEPLOYER_ADDRESS']
  const deployerPassword = getConfig()['DEPLOYER_PASSWORD']

  console.log('Deployer Address', deployerAddress)
  console.log('Deployer Password', deployerPassword)

  const payerEth = (!fundFromTest) ? await wallet.prepareSignerEth({
    address    : deployerAddress,
    password   : deployerPassword,
  }) : null

  console.log('Paying 0.1 ETH...')
  if (fundFromTest) {
    await wallet.payTest({
      fromAddress: deployerAddress,
      toAddress: address,
      weiValue: toWei('0.1', 'ether'),
    })
  } else {
    await wallet.pay({
      eth: payerEth,
      fromAddress: deployerAddress,
      toAddress: address,
      weiValue: toWei('0.1', 'ether'),
    })
  }
  console.log('Paying complete.')
}

mainFunc(process.argv[2] === 'test').then(() => console.log("That's all folks"))
