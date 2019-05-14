#!/usr/bin/env node

// Create a random new encrypted account on a remote DB
// and fund it from DEPLOYER_ADDRESS in your .env

const assert = require('chai').assert
const { getConfig } = require('demo-utils')
const { wallet } = require('demo-keys')
const { toWei } = require('web3-utils')

const mainFunc = async () => {
  await wallet.init({ autoConfig: true, unlockSeconds: 1 })
  const { address, password } = await wallet.createEncryptedAccount()
  console.log('New Address' , address )
  console.log('New Password', password)

  const deployerAddress  = getConfig()['DEPLOYER_ADDRESS']
  const deployerPassword = getConfig()['DEPLOYER_PASSWORD']

  console.log('Deployer Address', deployerAddress)
  console.log('Deployer Password', deployerPassword)

  const { spenderEth: payerEth, address: payerAddress } = await wallet.createSpenderEth({
    autoConfig : true,
    autoInit   : false,
    autoCreate : false,
    address    : deployerAddress,
    password   : deployerPassword,
  })

  assert.equal(payerAddress, deployerAddress)
  console.log('Paying 0.1 ETH...')
  await wallet.pay({
    eth: payerEth,
    fromAddress: deployerAddress,
    toAddress: address,
    weiValue: toWei('0.1', 'ether'),
  })

  console.log('Paying complete.')
}

mainFunc().then(() => console.log("That's all folks"))
