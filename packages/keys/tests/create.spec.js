'use strict'

const assert = require('chai').assert
const BN = require('bn.js')
const randombytes = require('randombytes')
const util = require('ethereumjs-util')
const { getNetwork, Logger } = require('demo-utils')
const LOGGER = new Logger('create.spec')
const keys = require('..')
const { wallet, isAccount } = keys
const { toWei } = require('web3-utils')
describe('Remote account created from private key', () => {

    let privateString
    let result
    let testAccounts
    const eth = getNetwork()

    before(async () => {
        privateString = randombytes(32).toString('hex')
        await wallet.init({ autoConfig: true, unlockSeconds: 10 })
        result = await wallet.createFromPrivateString({privateString: privateString})
        LOGGER.debug('New account', result)
        testAccounts = await eth.accounts()
    })

    it('generates the correct local result', async () => {
        assert.equal(result.password.length, 64)
        assert.equal(result.account.get('privateString'), privateString)
    })

    it('is retrieved back and recovered with same password', async () => {
        assert( util.isValidAddress(result.address) )
        const encryptedJSON =
      await wallet.loadEncryptedAccount({address: result.address })
        const recoveredAccount = keys.encryptedJSONToAccount({
            encryptedJSON: encryptedJSON, password: result.password })
        assert.equal(recoveredAccount.get('addressPrefixed'), result.address)
        assert.equal(recoveredAccount.get('privateString'), privateString)
        assert(isAccount(recoveredAccount),
            `Recovered account ${recoveredAccount} is not a valid account`)
    })

    it('can spend money sent to it', async () => {
        await wallet.payTest({
            eth         : eth,
            weiValue    : toWei('0.01', 'ether'),
            fromAddress : testAccounts[1],
            toAddress   : result.address,
            label       : 'Test -> new account',
        })
        const bal = await eth.getBalance(result.address)
        assert( bal.eq(new BN(toWei('0.01', 'ether'))),
            `Balance not 0.01 ETH, instead ${bal.toString()}`)
        const { signerEth } = await wallet.prepareSignerEth({
            address: result.address, password: result.password })
        await wallet.pay({
            eth         : signerEth,
            payAll      : true,
            overage     : '3350000',
            fromAddress : result.address,
            toAddress   : testAccounts[1],
            label       : 'New account -> test account',
        })
    }) 
    
})
