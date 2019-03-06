const assert = require('chai').assert
const utils  = require('ethereumjs-utils')
const { toWei } = require('web3-utils')
const { getNetwork, print }
             = require('@democracy.js/utils') 
const keys   = require('../src/keys')
const Wallet = require('../src/wallet')
const BN     = require('bn.js')
const { Range, List } = require('immutable')

describe('Signing and spending transactions', () => {

  let eth 
  let testAccounts
  let newAccounts
  let testBalances = []

  before(async () => {
    newAccounts = List(Range(0,2).map((i) => keys.create() ))
    eth = getNetwork('test', require('config'))
    testAccounts = await eth.accounts() 
  })

  it('make sure that we have > 99 ETH for old accounts', async () => {
    Promise.all(testAccounts.map((acct) => { return eth.getBalance(acct) })).
      then((values) => {
        values.map((value, i) => {
          testBalances[i] = new BN(value)
          assert(new BN(value).gt(toWei('99', 'ether')))
    }) })
  })

  it('can transfer money from a testAccount to a new account', async () => {

    //const ethSender = Wallet.createSignerEth('http://localhost:8545', testAccounts[0])
    const txHash = await eth.sendTransaction(
      { value: toWei('1', 'ether'),
        data : "0x",
        from : testAccounts[0],
        to   : newAccounts.get(0).get('addressPrefixed'),
        nonce: await eth.getTransactionCount(testAccounts[0]),
      })
    assert(txHash)
    const tx = await eth.getTransactionByHash(txHash)
    const txReceipt = await eth.getTransactionReceipt(txHash)
    const gasValue = new BN(tx.gasPrice).mul(new BN(txReceipt.gasUsed))
    assert(txReceipt && txReceipt.transactionHash === txHash)
    const balance = await eth.getBalance(newAccounts.get(0).get('addressPrefixed'))
    assert.equal(toWei('1', 'ether'), balance)
    const newBalance = await eth.getBalance(testAccounts[0])
    const expectedBalance =  new BN(testBalances[0])
                 .sub(new BN(toWei('1', 'ether')))
                 .sub(gasValue)
    const actualBalance = new BN(newBalance)
    assert.equal(expectedBalance.toString(10), actualBalance.toString(10))
  })  
  
  it('can transfer money from one new account to another', async () => {

    const fromAddr = newAccounts.get(0).get('addressPrefixed')
    const oldFromBalance = await eth.getBalance(fromAddr)

    const ethSender = Wallet.createSignerEth('http://localhost:8545', newAccounts.get(0))
    const txHash = await ethSender.sendTransaction(
      { value: toWei('0.333', 'ether'),
        data : "0x",
        from : fromAddr,
        to   : newAccounts.get(1).get('addressPrefixed'),
        nonce: await eth.getTransactionCount(fromAddr),
        gas  : 30000
      })

    assert(txHash)
    const tx = await eth.getTransactionByHash(txHash)
    const txReceipt = await eth.getTransactionReceipt(txHash)
    const gasValue = new BN(tx.gasPrice).mul(new BN(txReceipt.gasUsed))
    assert(txReceipt && txReceipt.transactionHash === txHash)

    const toBalance = await eth.getBalance(newAccounts.get(1).get('addressPrefixed'))
    assert.equal(toWei('0.333', 'ether'), toBalance)
    const newFromBalance = await eth.getBalance(newAccounts.get(0).get('addressPrefixed'))
    const expectedBalance = new BN(oldFromBalance)
                 .sub(new BN(toWei('0.333', 'ether')))
                 .sub(gasValue)
    const actualBalance = new BN(newFromBalance)
    assert.equal(expectedBalance.toString(10), actualBalance.toString(10))
  })

  it('creates a wallet and then destructs it', async () => {
    const wallet = new Wallet(eth, newAccounts.get(0))
    wallet.destruct()
  })

})
