/**
 * Wallet functions and state
 *
 * @memberof module:wallet
 */
const assert = require('chai').assert

const { Map } = require('immutable')
const { getNetwork, getConfig, getEndpointURL, Logger, toJS, fromJS, deepEqual }
  = require('demo-utils')
const LOGGER = new Logger('wallet')

const BN = require('bn.js')
const randombytes = require('randombytes')
const SignerProvider 
              = require('ethjs-provider-signer')
const ethsign = require('ethjs-signer').sign
const Eth     = require('ethjs')
const { create, createFromAddress, createFromPrivateKey, isAccount,
        encryptedJSONToAccount, accountToEncryptedJSON }
              = require('./keys')
const { toWei, fromWei } = require('web3-utils')
const { isValidAddress, isValidPrivate }
              = require('ethereumjs-utils')
const { createInOut } = require('demo-client')
const { awaitInputter, awaitOutputter } = require('demo-contract')

const OVERAGE = toWei('0.00075', 'ether')

const wallet = {}

/**
 * Convenience method to create a new account if no address/password is given,
 * otherwise load and unlock the given address
 * from the (remote) store. Finally create a signerEth with it.
 * Equivalent to calling
 * `wallet.loadEncryptedAccount`, `wallet.unlockEncryptedAccount`, `wallet.createSignerEth`
 *
 * @method prepareSignerEth
 * @memberof module:wallet
 * @param address {String} `0x`-prefixed Ethereum address to create a signer around
 * @param password {String} password to unlock the given Ethereum account
 * @return address {String} a `0x`-prefixed Ethereum address, auto-created if missing `address` param
 * @return password {String} a hex password string, auto-created if missing `password` param
 * @return signerEth {Eth} an Ethereum network object, tied to above address, signing transactions and spending funds from it
 */
wallet.prepareSignerEth = async ({ address, password }) => {
  const autoCreate = !address && !password
  const pair  = (autoCreate) ? (await wallet.createEncryptedAccount()) :
    { address: address, password: password }
  const _address  = pair.address
  const _password = pair.password
  LOGGER.debug('AUTO', _address, _password)

  const encryptedAccount = await wallet.loadEncryptedAccount({ address: _address })
  await wallet.unlockEncryptedAccount({ address: _address, password: _password })
  return {
    address: _address,
    password: _password,
    signerEth: wallet.createSignerEth({ url: getEndpointURL(), address: _address }),
  }
}

/**
 * Create a signer provider given the current URL and account.
 * TODO: change democracy API to return the endpoint url from a config name
 *
 * @method createSignerEth
 * @memberof module:wallet
 * @param url {String} the URL of an endpoint
 * @param address {String} `0x`-prefixed Ethereum address of sender
 */
wallet.createSignerEth = ({url, address}) => {
    assert( isValidAddress(address), `Invalid Ethereum address ${address}` )
    const provider = new SignerProvider(url, {
      signTransaction: async (rawTx, cb) => {
        let account = wallet.accountsMap[address]
        if ( isAccount(account) ) {
          cb(null, ethsign(rawTx, account.get('privatePrefixed') ) )
        } else {
          throw new Error(`Account ${address} is locked. Call wallet.unlockEncryptedAccount`)
        }
      },
      accounts: (cb) => cb(null, [address]),
    })
    wallet.signersMap[address] = new Eth(provider)
    return wallet.signersMap[address]
  }

wallet.initialized = false
wallet.inputter = null
wallet.outputter = null
wallet.accountsMap = {}
wallet.signersMap = {}
wallet.eth = getNetwork()

wallet.UNLOCK_TIMEOUT_SECONDS = 600
// The measured gas costs of transferring 100 ETH
wallet.OVERAGE_100_ETH = toWei('0.0134', 'ether')
wallet.unlock_seconds

/**
 * Initialize the wallet.
 *
 * @method init
 * @memberof module:wallet
 * @param autoConfig {boolean}
 * @param unlockSeconds {Number}
 */
wallet.init = async ({autoConfig, unlockSeconds}) => {
  if (wallet.initialized) { LOGGER.error("Wallet already initialized.") }
  if (!require('keythereum')) {
    LOGGER.error("Missing keythereum, did you add a script tag?")
  }
  const inout = await createInOut({autoConfig: autoConfig})
  wallet.inputter = inout.inputter
  wallet.outputter = inout.outputter
  wallet.unlockSeconds = (unlockSeconds) ? unlockSeconds : wallet.UNLOCK_TIMEOUT_SECONDS
  wallet.chainId = await wallet.eth.net_version()
  wallet.initialized = true
}

/**
 * Create an encrypted account.
 *
 * @method createEncryptedAccount
 * @memberof module:wallet
 * @return address {String} a `0x`-prefixed Ethereum address
 * @return password {String} a random password string
 * @return encryptedAccount {JSON} the geth-format enciphered Ethereum private key
 * @return result {JSON} the result of saving the encryptedAccount to a (remote) store
 */
wallet.createEncryptedAccount = async () => {
  if (!wallet.initialized) { LOGGER.error("Call wallet.init() first.") }
  const account = create()
  const address = account.get('addressPrefixed')
  const password = randombytes(32).toString('hex')
  const encryptedAccount = accountToEncryptedJSON({ account: account, password: password })
  const result = await wallet.saveEncryptedAccount({ address: address, encryptedAccount: encryptedAccount })
  assert( result, `Saving encrypted account for ${address} ${encryptedAccount} failed` )
  return {
    address: address,
    password: password,
    result: result,
    encryptedAccount: encryptedAccount,
  }
} 

/**
 * Retrieves encrypted account for this address from a (possibly remote) persistent store.
 *
 * @method loadEncryptedAccount
 * @memberof module:wallet
 * @param address {String} `0x`-prefixed Ethereum address associated with desired account.
 * @return encrypted JSON account for the given address.
 */
wallet.loadEncryptedAccount = async ({ address }) => {
  if (!wallet.initialized) { LOGGER.error("Call wallet.init() first.") }
  return awaitInputter(
    wallet.inputter(`keys/${wallet.chainId}/${address}`, null),
    (encryptedAccount) => {
      if (!encryptedAccount) { throw new Error(`Account not found for ${address}`) }
      //const account = encryptedJSONToAccount( toJS(encryptedAccount), password )
      //assert( isAccount(account), `Invalid account retrieved ${account}` )
      //const _address = account.get('addressPrefixed')
      //assert.equal( _address, address,
      //             `Recovered address ${_address} doesn't match ${address}`)
      wallet.accountsMap[address] = toJS( encryptedAccount )
      LOGGER.debug(`Loaded encrypted account for ${address}`)
      return toJS( encryptedAccount )
    }
  )
}

/**
 * Saves the encrypted account to a (remote) store
 *
 * @method saveEncryptedAccount
 * @memberof module:wallet
 * @param address {String} a `0x`-prefixed Ethereum address associated with this account
 * @param encryptedAccount {JSON} geth-formatted key to save in a (remote) store
 */
wallet.saveEncryptedAccount = async ({ address, encryptedAccount }) => {
  if (!wallet.initialized) { LOGGER.error("Call wallet.init() first.") }
  if (wallet.accountsMap[address]) {
    throw new Error(`Attempting to overwrite existing account at ${address}`)
  }
  wallet.accountsMap[address] = encryptedAccount
  return awaitOutputter(
    wallet.outputter( `keys/${wallet.chainId}/${address}`, fromJS(encryptedAccount) ),
    // Delay by one second, so that subsequent calls to inputter will return the newly
    // saved key
    (output) => { return new Promise((resolve, reject) => {
      setTimeout(() => { resolve(output) }, 1000)
    }) }
  )
}

/**
 * Unlock an encrypted account.
 *
 * @method unlockEncryptedAccount
 * @memberof module:wallet
 * @param address {String} `0x`-prefixed Ethereum address associated with account to unlock
 * @param password {String} to unlock the given account
 */
wallet.unlockEncryptedAccount = async ({ address, password }) => {
  const encryptedAccount = wallet.accountsMap[address]
  if ( isAccount(encryptedAccount) ) {
    throw new Error(`Account ${address} already unlocked`)
  }
  if (!address || !password) {
    throw new Error(`Empty address ${address} or password`)
  }
  LOGGER.debug('ENCRYPTED ACCOUNT', encryptedAccount)
  wallet.accountsMap[address] =
    encryptedJSONToAccount({ encryptedJSON: encryptedAccount, password: password })
  LOGGER.debug('Unlocked', address, isAccount(wallet.accountsMap[address]))
  const relockFunc = () => { wallet.accountsMap[address] = encryptedAccount } 
  setTimeout(relockFunc, wallet.unlockSeconds * 1000)
  return relockFunc
}

/**
 * Transfer ETH between the given addresses, whose accounts have already been unlocked.
 *
 * @method pay
 * @memberof module:wallet
 * @param payAll {boolean} whether to transfer all spendable value
 * @param weiValue {String} the amount in wei to transfer (ignored if `payAll` is true)
 * @param fromAddress {String} `0x`-prefixed Ethereum address of sender
 * @param toAddress {String} `0x`-prefixed Ethereum address of receiver
 * @param overage {String} optional, the amount of fees to withhold if `payAll` is true)
 * @param label {String} optional, a debug label to log for this transaction
 */
wallet.pay = async ({payAll, weiValue, fromAddress, toAddress, overage, label}) => {
  const signer = wallet.signersMap[fromAddress]
  if (!signer) { throw new Error(`No signer created for address ${fromAddress}`) }
  return wallet.payTest({eth: signer, fromAddress: fromAddress, payAll: payAll, toAddress: toAddress, weiValue: weiValue, overage: overage, label: label}) 
}

/**
 * Pay from a test account (that is already unlocked on the Ethereum node)
 *
 * @method payTest
 * @memberof module:wallet
 * @param weiValue {String} representing the value in wei
 * @param fromAddress {String} Ethereum address of payer/sender
 * @param toAddress {String} Ethereum address of recipient
 */
wallet.payTest = async ({eth, weiValue, fromAddress, toAddress, payAll, overage, label}) => {
  LOGGER.debug('LABEL', label)
  const gasLimit = new BN(getConfig()['GAS_LIMIT'])
  const gasPrice = new BN(getConfig()['GAS_PRICE'])
  const _overage = (overage) ? overage : wallet.OVERAGE_100_ETH
  if (payAll) {
    LOGGER.debug('OVERAGE', fromWei(_overage, 'ether'))
    LOGGER.debug('fromAddress', fromAddress)
    LOGGER.debug('toAddress', toAddress)
    const balance = await wallet.eth.getBalance(fromAddress)
    LOGGER.debug(`payAll for balance of ${fromWei(balance.toString(), 'ether')}`)
    
    const gasEstimate = await wallet.eth.estimateGas({
      from: fromAddress, to: toAddress, value: balance, data: '0x'})
    //LOGGER.debug(`Gas estimate for payAll is ${gasEstimate}`)
    //LOGGER.debug(`Gas price is ${gasPrice} Gwei`)
    const gasAmount = new BN(gasEstimate).mul(new BN(gasPrice)).mul(new BN(toWei('10', 'gwei')))
    //LOGGER.debug(`Gas amount is ${gasAmount}`)
    weiValue = new BN(balance).sub(new BN(_overage)).toString(10)
    LOGGER.debug(`Sendable wei value is ${fromWei(weiValue, 'ether')} ETH`)
  }
  const _eth = (eth) ? eth : wallet.eth
  LOGGER.debug(`Sending wei value is ${fromWei(weiValue, 'ether')} ETH`)
  return _eth.sendTransaction({
    value    : weiValue,
    data     : "0x",
    from     : fromAddress,
    to       : toAddress,
    gas      : gasLimit,
    gasPrice : gasPrice,
    nonce    : await wallet.eth.getTransactionCount(fromAddress),
  })
}

wallet.fromWei = fromWei
wallet.toWei   = toWei

module.exports = wallet
