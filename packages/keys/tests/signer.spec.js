const assert = require('chai').assert
const expect = require('chai').expect
const utils  = require('ethereumjs-utils')

const { getNetwork, print, Logger }
             = require('demo-utils') 
const LOGGER = new Logger('signer.spec')
const keys   = require('../src/keys')
const wallet = require('../src/wallet')
const BN     = require('bn.js')
const { fromWei, toWei } = require('web3-utils')
const { Range, List } = require('immutable')
const randombytes = require('randombytes')

const OVERAGE_100_ETH = toWei('0.0134', 'ether')

describe('Signing and spending transactions', () => {

  let eth 
  let testAccounts
  let newAccounts
  let testBalances = []
  let overage
  let bigSpender
  const password = randombytes(32).toString('hex')

  before(async () => {
    newAccounts = List(Range(0,2).map((i) => keys.create() ))
    eth = getNetwork()
    testAccounts = await eth.accounts()
    bigSpender = testAccounts[4]
    await wallet.init({autoConfig: false, unlockSeconds: 1})
  })

  it( 'make sure that we have > 99 ETH for old accounts', async () => {
    Promise.all(testAccounts.map((acct) => { return eth.getBalance(acct) })).
      then((values) => {
        values.map((value, i) => {
          testBalances[i] = new BN(value)
          assert(new BN(value).gt(toWei('99', 'ether')))
    }) })
  })

  it( 'creates a Signer Eth', async () => {
    const account = keys.createFromPrivateString(newAccounts.get(0).get('privateString'))
    const address = account.get('addressPrefixed')
    const encryptedAccount = keys.accountToEncryptedJSON( account, password )
    await wallet.saveEncryptedAccount( address, encryptedAccount ) 
    await wallet.unlockEncryptedAccount( address, password ) 
    const ethSender = wallet.createSignerEth({ url: 'http://localhost:8545', address: address })
    wallet.createSignerEth({ url: 'http://localhost:8545', address: newAccounts.get(1).get('addressPrefixed') })
  })

  it( 'can transfer money from a testAccount to a new account', async () => {

    // We create the signer just to register testAccounts[9] but then discard
    // it, since we don't need to sign transactions sent from test accounts
    const ethSender = wallet.createSignerEth({ url: 'http://localhost:8545', address: testAccounts[9] })
    /*
    const txHash = await wallet.pay({
      eth        : eth,
      weiValue   : toWei('1', 'ether'),
      toAddress: testAccounts[9],
      fromAddress  : newAccounts.get(0).get('addressPrefixed'),
    })
   */
    const fromAddress = testAccounts[9] 
    const txHash = await wallet.payTest({
      eth        : eth,
      weiValue   : toWei('1', 'ether'),
      overage    : OVERAGE_100_ETH,
      fromAddress: fromAddress,
      toAddress  : newAccounts.get(0).get('addressPrefixed'),
    })
   
    assert(txHash)
    const tx = await eth.getTransactionByHash(txHash)
    const txReceipt = await eth.getTransactionReceipt(txHash)
    const gasValue = new BN(tx.gasPrice).mul(new BN(txReceipt.gasUsed))
    assert(txReceipt && txReceipt.transactionHash === txHash)
    const balance = await eth.getBalance(newAccounts.get(0).get('addressPrefixed'))
    assert.equal(toWei('1', 'ether'), balance)
    const newBalance = await eth.getBalance(fromAddress)
    const expectedBalance =  new BN(testBalances[9])
                 .sub(new BN(toWei('1', 'ether')))
                 .sub(gasValue)
    const actualBalance = new BN(newBalance)
    assert.equal( actualBalance.toString(10), expectedBalance.toString(10) )

  })  
  
  it( 'can transfer money from one new account to another', async () => {

    const fromAddr = newAccounts.get(0).get('addressPrefixed')
    const oldFromBalance = await eth.getBalance(fromAddr)

    const ethSender = wallet.createSignerEth({ url: 'http://localhost:8545', address: fromAddr })
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

  it( 'tries to transfer all money to get the gas overage', async () => {
    const toAddress = newAccounts.get(0).get('addressPrefixed')

    wallet.payTest({
      eth        : eth,
      payAll     : true,
      fromAddress: bigSpender,
      toAddress  : toAddress,
    }).catch((e) => {
      console.error('ERROR', e.message)
      const upfrontCost = e.message.match('The upfront cost is: ([0-9]+)')[1]
      const onlyHas = e.message.match('only has: ([0-9]+)')[1]
      overage = new BN(upfrontCost).sub(new BN(onlyHas))
      LOGGER.info(`Gas overage is ${fromWei(overage, 'ether')} ether`)
    })

  })

  it( 'can transfer all money from one account to another', async () => {

    const toAddress = newAccounts.get(0).get('addressPrefixed')
    const oldFromBalance = await eth.getBalance(bigSpender)
    const oldToBalance = await eth.getBalance(toAddress)
    LOGGER.debug('overage', overage ? overage.toString(10) : '')

    const txHash = await wallet.payTest({
      eth        : eth,
      payAll     : true,
      overage    : OVERAGE_100_ETH,
      fromAddress: bigSpender,
      toAddress  : toAddress,
    })

    const newFromBalance = await eth.getBalance(bigSpender)
    const newToBalance = await eth.getBalance(toAddress)
    LOGGER.debug('newToBalance', fromWei(newToBalance, 'gwei'))
    assert.equal(newFromBalance, toWei('0.01298', 'ether'),
                 `newFromBalance should be zero, instead ${fromWei(newFromBalance, 'ether')} ETH`)
    const expected = new BN(oldToBalance).add(new BN(oldFromBalance)).sub(new BN(OVERAGE_100_ETH)).toString(10)
    assert.equal(newToBalance, expected,
                 `newToBalance should receive all funds ${expected}, instead ${newToBalance}`)
 
    // Pay the money back so tests above are repeatable
    const txHash2 = await wallet.pay({
      eth        : eth,
      payAll     : true,
      overage    : OVERAGE_100_ETH,
      fromAddress: toAddress,
      toAddress  : bigSpender,
    })
  })
 
  it( 'wallet relocks and is unspendable', async() => {
    const fromAddress = newAccounts.get(1).get('addressPrefixed')
    expect( new Promise((resolve, reject) => {
      setTimeout( () => {
        wallet.pay({
          payAll     : true,
          overage    : OVERAGE_100_ETH,
          fromAddress: fromAddress,
          toAddress  : bigSpender,
        })
        .then((val) => { LOGGER.error('VAL', val); reject(new Error(val))})
        .catch((err) => { LOGGER.info('ERR', err.message); resolve(err.message)})
      }, 1000)
    }) ).to.be.rejectedWith(Error)
  })
/*
  it( 'unlocking wallet first makes it spendable', async() => {
    return new Promise((resolve, reject) => {
      setTimeout( async () => {
        const address = newAccounts.get(1).get('addressPrefixed')
        const encryptedAccount = keys.accountToEncryptedJSON( newAccounts.get(1), password )
        LOGGER.debug("SAVING", address, password)
        await wallet.saveEncryptedAccount( address, encryptedAccount ) 
        LOGGER.debug("UNLOCKING", address, password)
        await wallet.unlockEncryptedAccount( address, password ) 
        return wallet.pay({
          payAll     : true,
          overage    : OVERAGE_100_ETH,
          fromAddress: address,
          toAddress  : bigSpender,
        })
        .then((val) => { LOGGER.error('VAL', val); resolve(val)})
        .catch((err) => { LOGGER.info('ERR', err.message); reject(err.message)})
      }, 2000)
    })
  })
*/
})
