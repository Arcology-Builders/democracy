#!/usr/bin/env node
'use strict'

// Fund an existing account from a test account
//
// Usage: NODE_ENV={ENV} node ./bin/fundAccount [payeeAddress] ['payAll' | ethValue] [testAccountIndex]
// For example: NODE_ENV=DEVELOPMENT node ./bin/fundAccount 0x1051cd3f5d5f3e097713265732a10677c043ccea payAll 0

const assert = require('chai').assert
const { getConfig, getNetwork } = require('demo-utils')
const { wallet } = require('demo-keys')
const { toWei } = require('ethjs-unit')

const mainFunc = async (payeeAddress, ethValue, fundFromTest) => {

  const eth = getNetwork()
  const accounts = await eth.accounts()
  const deployerAddress  = (fundFromTest) ? accounts[fundFromTest] : getConfig()['DEPLOYER_ADDRESS']
  const deployerPassword = getConfig()['DEPLOYER_PASSWORD']
  await wallet.init({ unlockSeconds: 2, autoConfig: true })
  console.log(deployerPassword)

  assert(payeeAddress, `No payee address specified`)
  const weiValue = (ethValue !== 'payAll') ? toWei(ethValue, 'ether') : '0'

  console.log(`Paying ${ethValue} ETH from ${deployerAddress} ...`)
  if (fundFromTest) {
    await wallet.payTest({
      fromAddress: deployerAddress,
      toAddress: payeeAddress,
      payAll: (ethValue === 'payAll'),
      weiValue: weiValue,
    })
  } else {
    await wallet.prepareSignerEth({ address: deployerAddress, password: deployerPassword })
    await wallet.pay({
      fromAddress: deployerAddress,
      toAddress: payeeAddress,
      weiValue: weiValue,
    })
  }
  console.log('Paying complete.')

  wallet.shutdownSync()
}

console.log(process.argv.slice(2,5))
mainFunc(...process.argv.slice(2,5)).then(() => console.log("That's all folks"))
