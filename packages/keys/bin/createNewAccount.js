#!/usr/bin/env node

// Create a random new encrypted account on a remote DB
// and fund it either from a test account or
// from DEPLOYER_ADDRESS in your .env
// Useful for creating a new deployer address
//
// Usage: node ./createNewAccount.js [test|env] [payAll|<payAmount>]

const assert = require('chai').assert
const { getConfig, getNetwork } = require('demo-utils')
const { wallet } = require('demo-keys')
const { toWei } = require('ethjs-unit')
const { List, Range } = require('immutable')

const mainFunc = async (fundFromTest, payAmount) => {
  await wallet.init({ autoConfig: true, unlockSeconds: 1 })
  const { address, password } = await wallet.createEncryptedAccount()
  const { address: _address, password: _password } =
    await wallet.prepareSignerEth({ address: address, password: password })
  assert.equal( address, _address, `Could not retrieve back the new address` )
  assert.equal( password, _password, `Could not retrieve back the new password` )
  console.log('Payee Address' , address )
  console.log('Payee Password', password)

  const eth = getNetwork()
  const testAccounts = await eth.accounts()

  const fund = async (funderAddress) => {

    console.log('Funder Address' , funderAddress)

    const payAll = (payAmount === 'payAll')
    console.log(`Paying ${payAmount} ETH...`)
    if (fundFromTest) {
      await wallet.payTest({
        fromAddress : funderAddress,
        toAddress   : address,
        payAll      : payAll,
        weiValue    : payAll ? '0' : toWei(payAmount, 'ether'),
      })
    } else {
      const { signerEth } = await wallet.prepareSignerEth({
        address     : funderAddress,
        password    : funderPassword,
      })

      const weiValue = (payAll && Number.isFinite(parseFloat(payAmount))) ? '0'
        : toWei(payAmount, 'ether')
      await wallet.pay({
        eth         : signerEth,
        fromAddress : funderAddress,
        toAddress   : address,
        payAll      : payAll,
        weiValue    : weiValue,
      })
    }
    console.log(`Paying complete from account ${funderAddress}`)
  }

  const funderPassword = getConfig()['DEPLOYER_PASSWORD']
  console.log('Funder Password', funderPassword)

  return (fundFromTest) ?
    Promise.all(List(Range(0,10)).map((i) => {
      return fund(testAccounts[i])
    })) : fund(getConfig()['DEPLOYER_ADDRESS'])

}

mainFunc(process.argv[2] === 'test',
         process.argv[3]).then(() => console.log("That's all folks"))
