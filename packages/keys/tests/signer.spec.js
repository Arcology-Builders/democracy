const chai   = require('chai')
const assert = chai.assert
chai.use(require('chai-as-promised'))

const { getNetwork, Logger } = require('demo-utils') 
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
        newAccounts = List(Range(0,2).map(() => keys.create() ))
        eth = getNetwork()
        testAccounts = await eth.accounts()
        bigSpender = testAccounts[4]
        await wallet.init({autoConfig: false, unlockSeconds: 100})
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
        const encryptedAccount = keys.accountToEncryptedJSON({ account: account, password: password })
        await wallet.saveEncryptedAccount({ address: address, encryptedAccount: encryptedAccount }) 
        await wallet.unlockEncryptedAccount({ address: address, password: password }) 
        await wallet.createSignerEth({
            url: 'http://localhost:8545', address: newAccounts.get(1).get('addressPrefixed') })
    })

    it( 'can transfer money from a testAccount to a new account', async () => {

        // We create the signer just to register testAccounts[9] but then discard
        // it, since we don't need to sign transactions sent from test accounts
        wallet.createSignerEth({
            url: 'http://localhost:8545', address: testAccounts[9] })

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

        const ethSender = wallet.createSignerEth({
            url: 'http://localhost:8545', address: fromAddr })
        const txHash = await ethSender.sendTransaction(
            { value: toWei('0.333', 'ether'),
                data : '0x',
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
    /*
  it( 'tries to transfer all money to get the gas overage', async () => {
    const toAddress = newAccounts.get(0).get('addressPrefixed')

    wallet.payTest({
      eth        : eth,
      payAll     : true,
      overage    : '0',
      fromAddress: bigSpender,
      toAddress  : toAddress,
    }).catch((e) => {
      console.error('ERROR', e.message)
      const upfrontCostMatch = e.message.match('The upfront cost is: ([0-9]+)')
      assert.equal(upfrontCostMatch.length, 2,
                   `"Upfront cost" match was not 2, instead ${upfrontCostMatch.length}`)
      const onlyHasMatch = e.message.match('only has: ([0-9]+)')
      assert.equal(onlyHasCostMatch.length, 2,
                   `"only has" match was not 2, instead ${onlyHasMatch.length}`)
      const upfrontCost = upfrontCostMatch[1]
      const onlyHas = onlyHasCostMatch[1]
      overage = new BN(upfrontCost).sub(new BN(onlyHas))
      LOGGER.info(`Gas overage is ${fromWei(overage, 'ether')} ether`)
    })

  })
*/
    it( 'can transfer all money from one account to another', async () => {

        const toAddress = newAccounts.get(0).get('addressPrefixed')
        const oldFromBalance = await eth.getBalance(bigSpender)
        const oldToBalance = await eth.getBalance(toAddress)
        LOGGER.debug('overage', overage ? overage.toString(10) : '')
        // Start commenting here, to transfer back all funds to bigSpender in case of an error

        await wallet.payTest({
            eth        : eth,
            payAll     : true,
            overage    : OVERAGE_100_ETH,
            fromAddress: bigSpender,
            toAddress  : toAddress,
            label      : 'First',
        })

        const newFromBalance = await eth.getBalance(bigSpender)
        const newToBalance = await eth.getBalance(toAddress)
        LOGGER.debug('newToBalance', fromWei(newToBalance, 'gwei'))
        assert(new BN(newFromBalance).lt(new BN(OVERAGE_100_ETH)),
            `newFromBalance should be zero, instead ${fromWei(newFromBalance, 'ether')} ETH`)
        const expected = new BN(oldToBalance).add(new BN(oldFromBalance)).sub(new BN(OVERAGE_100_ETH)).toString(10)
        assert.equal(newToBalance, expected,
            `newToBalance should receive all funds ${expected}, instead ${newToBalance}`)
   
        // Stop commenting here, to transfer back all funds to bigSpender in case of an error 
        // Pay the money back so tests above are repeatable
        await wallet.pay({
            eth        : eth,
            payAll     : true,
            overage    : OVERAGE_100_ETH,
            fromAddress: toAddress,
            toAddress  : bigSpender,
            label      : 'Second',
        })
    })

    after(() => {
      wallet.shutdownSync()
    })

})
