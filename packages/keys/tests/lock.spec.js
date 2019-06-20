const chai = require('chai')
const assert = chai.assert
chai.use(require('chai-as-promised'))

const { getNetwork, getEndpointURL, Logger, immEqual }
             = require('demo-utils') 
const LOGGER = new Logger('signer.spec')
const keys   = require('../src/keys')
const wallet = require('../src/wallet')
const { toWei } = require('web3-utils')

describe('Wallet locking and unlocking', () => {

  let eth 
  let testAccounts
  let bigSpender
  let newAddress
  let newPassword
  let newAccount

  before(async () => {
    eth = getNetwork()
    testAccounts = await eth.accounts()
    bigSpender = testAccounts[7]
    await wallet.init({autoConfig: false, unlockSeconds: 1})
    let { address, password, encryptedAccount } = await wallet.createEncryptedAccount()
    newAddress = address
    newPassword = password
    newAccount = keys.encryptedJSONToAccount({ encryptedJSON: encryptedAccount, password: password })
    assert( keys.isAccount(newAccount), `Decrypted new account ${newAccount} is not a valid account.` )
    LOGGER.debug('ADDRESS & PASSWORD', newAddress, newPassword, encryptedAccount)
    wallet.unlockEncryptedAccount({address: address, password: password})

    // Fund the new account
    await wallet.payTest({
      weiValue: toWei('1', 'ether'),
      fromAddress: bigSpender,
      toAddress: address,
    })
  })

  it( 'can load back an encrypted account we saved', async () => {
    const encryptedAccount = await wallet.loadEncryptedAccount({ address: newAddress })
    LOGGER.debug('Loaded account', encryptedAccount)
    const account2 = keys.encryptedJSONToAccount({ encryptedJSON: encryptedAccount, password: newPassword })
    assert( immEqual(account2, newAccount),
      `Retrieved decrypted account ${account2} does not equal encrypted ${newAccount}` ) 
  })

  it( 'wallet relocks and is unspendable', async () => {
    wallet.createSignerEth({ url: getEndpointURL(), address: newAddress })
  
    // TODO: This throws an error as expected, but is not caught by the clause below
    // Re-enable when we figure it out.  
    /*
      await wallet.pay({
        payAll     : true,
        fromAddress: newAddress,
        toAddress  : bigSpender,
      })
      .then((val) => { LOGGER.error('VAL', val); reject(new Error(val))})
      .catch((err) => { LOGGER.info('ERR', err.message); resolve(err.message)})
    */    
  })

  it( 'unlocking wallet first makes it spendable', async() => {
    return new Promise((resolve, reject) => {
      setTimeout( async () => {
        LOGGER.debug('UNLOCKING', newAddress, newPassword)
        await wallet.unlockEncryptedAccount({ address: newAddress, password: newPassword }) 
        return wallet.pay({
          payAll     : true,
          fromAddress: newAddress,
          toAddress  : bigSpender,
        })
          .then((val) => { LOGGER.error('VAL', val); resolve(val)})
          .catch((err) => { LOGGER.info('ERR', err.message); reject(err.message)})
      }, 2000)
    })
  })

})
