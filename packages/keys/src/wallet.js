/**
 * Wallet functions and state
 *
 * @memberof module:wallet
 */
const assert = require('chai').assert

const {
  getNetwork, getConfig, getEndpointURL, Logger, toJS, fromJS, 
  awaitInputter, awaitOutputter } = require('demo-utils')
const LOGGER = new Logger('wallet')

const BN = require('bn.js')
const randombytes = require('randombytes')
const SignerProvider = require('ethjs-provider-signer')
const ethsign = require('ethjs-signer').sign
const Eth     = require('ethjs')
const keys = require('./keys')
const { toWei, fromWei } = require('web3-utils')
const { isValidAddress, toChecksumAddress } = require('ethereumjs-util')
const { createInOut } = require('demo-client')

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
  const _address  = toChecksumAddress(pair.address)
  const _password = pair.password
  LOGGER.debug('AUTO', _address, _password)

  await wallet.loadEncryptedAccount({ address: _address })
  await wallet.unlockEncryptedAccount({ address: _address, password: _password })
  wallet.lastSignerEth = await wallet.createSignerEth({ url: getEndpointURL(), address: _address }) // eslint-disable-line require-atomic-updates
  return {
    address   : _address,
    password  : _password,
    signerEth : wallet.lastSignerEth,
  }
}

/**
 * Validate the given address and password combination.
 *
 * @method validatePassword
 * @memberof module:wallet
 * @param address {String} `0x`-prefixed Ethereum address
 * @param password {String}
 * @return true if a valid address and password combo, otherwise false.
 */
wallet.validatePassword = async ({ address, password }) => {
  try {
    await wallet.loadEncryptedAccount({ address })
    await wallet.unlockEncryptedAccount({ address, password })
    return true
  } catch(e) {
    return false
  }
}

/**
 * Create an account from a private string and save it to the outputter.
 *
 * @method createFromPrivateString
 * @memberof module:wallet
 * @param privateString {String} hex Ethereum private key, with on `0x`-prefix, to create an account from.
 * @return {Object} password, address, result, account
 */
wallet.createFromPrivateString = async ({ privateString }) => {
  const account = keys.createFromPrivateString(privateString)
  const address = account.get('addressPrefixed')
  const password = randombytes(32).toString('hex')
  const encryptedJSON = keys.accountToEncryptedJSON({ account: account, password: password })
  const result = await wallet.saveEncryptedAccount({
    address: address, encryptedAccount: encryptedJSON })
  return {
    password : password,
    address  : address,
    result   : result,
    account  : account
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
  const checksumAddress = toChecksumAddress(address)
  const provider = new SignerProvider(url, {
    signTransaction: async (rawTx, cb) => {
      let account = wallet.getAccountSync(checksumAddress)
      if ( keys.isAccount(account) ) {
        cb(null, ethsign(rawTx, account.get('privatePrefixed') ) )
      } else {
        throw new Error(`Account ${address} is locked. Call wallet.unlockEncryptedAccount`)
      }
    },
    accounts: (cb) => cb(null, [checksumAddress]),
  })
  const newEth = new Eth(provider)
  newEth.address = checksumAddress
  wallet.signersMap[checksumAddress] = newEth
  LOGGER.debug(`Added a signer for ${address}`)
  return newEth
}

wallet.initialized = false
wallet.inputter = null
wallet.outputter = null
wallet._accountsMap = {}
wallet.signersMap = {}
wallet.relockMap = {}
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
wallet.init = async ({ autoConfig, unlockSeconds }) => {
  if (wallet.initialized) { LOGGER.debug('Wallet already initialized.'); return }
  const _autoConfig = autoConfig || true // save it remotely by default
  if (!require('keythereum')) {
    LOGGER.error('Missing keythereum, did you add a script tag?')
  }
  const inout = await createInOut({autoConfig: _autoConfig})
  wallet.inputter = inout.inputter     // eslint-disable-line require-atomic-updates
  wallet.outputter = inout.outputter   // eslint-disable-line require-atomic-updates
  wallet.unlockSeconds = (unlockSeconds) ? unlockSeconds : wallet.UNLOCK_TIMEOUT_SECONDS // eslint-disable-line require-atomic-updates
  wallet.chainId = await wallet.eth.net_version() // eslint-disable-line require-atomic-updates 
  wallet.initialized = true // eslint-disable-line require-atomic-updates
}

/**
 * Create an encrypted account.
 *
 * @method createEncryptedAccount
 * @memberof module:wallet
 * @param creatorFunc {Function} a factory function with no parameters that
 *   returns an account as an Immutable Map, with possible extra leading
 *   bytes in the public key that can be safely ignored / sliced.
 * @return address {String} a `0x`-prefixed Ethereum address
 * @return password {String} a random password string
 * @return encryptedAccount {JSON} the geth-format enciphered Ethereum private key
 * @return result {JSON} the result of saving the encryptedAccount to a (remote) store
 */
wallet.createEncryptedAccount = async () => {
  if (!wallet.initialized) { LOGGER.error('Call wallet.init() first.') }
  const account = keys.create()
  const address = account.get('addressPrefixed')
  const password = randombytes(32).toString('hex')
  const encryptedAccount = keys.accountToEncryptedJSON({
    account: account, password: password })
  const result = await wallet.saveEncryptedAccount({
    address: address, encryptedAccount: encryptedAccount })
  assert( result, `Saving encrypted account for ${address} ${encryptedAccount} failed` )
  return {
    address          : address,
    password         : password,
    result           : result,
    encryptedAccount : encryptedAccount,
  }
} 

wallet._setAccountSync = (address, value) => {
  const checksumAddress = toChecksumAddress(address)
  wallet._accountsMap[checksumAddress] = value
}

wallet.getAccountSync = (address, expectUnlocked) => {
  const checksumAddress = toChecksumAddress(address)
  const account = wallet._accountsMap[checksumAddress]
  LOGGER.debug('account', account)
  if (expectUnlocked) {
    assert( keys.isAccount(account), `Invalid account for ${checksumAddress}` )
  }
  return account
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
  if (!wallet.initialized) { LOGGER.error('Call wallet.init() first.') }
  const checksumAddress = toChecksumAddress(address)
  return awaitInputter(
    wallet.inputter(`keys/${wallet.chainId}/${address}`, null),
    (encryptedAccount) => {
      if (!encryptedAccount) { throw new Error(`Account not found for ${address}`) }
      wallet._setAccountSync(checksumAddress, toJS( encryptedAccount ) )
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
  if (!wallet.initialized) { LOGGER.error('Call wallet.init() first.') }
  const checksumAddress = toChecksumAddress(address)
  if (wallet.getAccountSync(checksumAddress)) {
    throw new Error(`Attempting to overwrite existing account at ${address}`)
  }
  wallet._setAccountSync(checksumAddress, encryptedAccount)
  assert( wallet.getAccountSync(checksumAddress), `Saved account for ${checksumAddress} is not returned.` )
  return awaitOutputter(
    wallet.outputter( `keys/${wallet.chainId}/${address}`, fromJS(encryptedAccount) ),
    // Delay by one second, so that subsequent calls to inputter will return the newly
    // saved key
    (output) => { return new Promise((resolve) => {
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
  const checksumAddress = toChecksumAddress(address)
  const encryptedAccount = wallet.getAccountSync(checksumAddress)
  if ( keys.isAccount(encryptedAccount) ) {
    throw new Error(`Account ${address} already unlocked`)
  }
  if (!address || !password) {
    throw new Error(`Empty address ${address} or password`)
  }
  const account = keys.encryptedJSONToAccount({ encryptedJSON: encryptedAccount, password })
  wallet._setAccountSync(checksumAddress, account)
  const relockFunc = () => {
    wallet._setAccountSync(checksumAddress, encryptedAccount)
  } 
  const id = setTimeout(relockFunc, wallet.unlockSeconds * 1000)
  wallet.relockMap[checksumAddress] = { id: id, relockFunc: relockFunc }
  return relockFunc
}

wallet.lockEncryptedAccountSync = ({ address }) => {
  const checksumAddress = toChecksumAddress(address)
  const { id, relockFunc } = wallet.relockMap[checksumAddress]
  if (id) {
    clearTimeout(id)
    relockFunc()
    delete wallet.relockMap[checksumAddress]
    LOGGER.debug(`Relocked ${address}`)
  }
}

wallet.shutdownSync = () => {
  for (var address in wallet.relockMap) {
    wallet.lockEncryptedAccountSync({ address: address })
  }
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
  const checksumAddress = toChecksumAddress(fromAddress)
  const signer = wallet.signersMap[checksumAddress]
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
  let gasLimit = new BN(getConfig()['GAS_LIMIT'])
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
    gasLimit = gasEstimate
    //gasLimit = new BN(gasEstimate).mul(new BN(gasPrice)).mul(new BN(toWei('10', 'gwei')))
    weiValue = new BN(balance).sub(new BN(_overage)).toString(10)
    LOGGER.debug(`Sendable wei value is ${fromWei(weiValue, 'ether')} ETH`)
  }
  const _eth = (eth) ? eth : wallet.eth
  LOGGER.debug(`Sending wei value is ${fromWei(weiValue, 'ether')} ETH`)
  return _eth.sendTransaction({
    value    : weiValue,
    data     : '0x',
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
