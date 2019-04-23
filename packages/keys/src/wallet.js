const assert = require('chai').assert

const { Map } = require('immutable')
const { getImmutableKey, setImmutableKey, getNetwork }
              = require('demo-utils')
const SignerProvider 
              = require('ethjs-provider-signer')
const ethsign = require('ethjs-signer').sign
const Eth     = require('ethjs')
const { create, createFromAddress, createFromPrivateKey, isAccount }
              = require('./keys')
const { isValidAddress, isValidPrivate }
              = require('ethereumjs-utils')

const Wallet = class {
  constructor(_eth, _account) {
    assert(_eth.net_version, `First constructor argument is not a network`)
    assert(isAccount(_account))
    this.baseEth = _eth
    this.account = (isValidAddress(_account)) ? createFromAddress(_address) : create()
    this.nonce = -1 
    this.keyPrefix = `wallets/${this.account.get('addressPrefixed')}`
    //this.noncePrefix = `${this.keyPrefix}/nonces`
    //setImmutableKey(`${this.noncePrefix}/_init`,
    //                new Map({"timestamp": Date.now()}))
  }
  
  getPrefixedAddress() {
    return this.account.get('prefixedAddress')
  }

  getPrefixedPrivateKey() {
    return this.account.get('prefixedPrivate')
  }

  getPrefixedPublicKey() {
    return this.account.get('prefixedPublic')
  }

  destruct() {
    //const nonceMap = getImmutableKey(this.noncePrefix)
    //print(nonceMap)
  }

  /**
   * Create a signer provider given the current URL and account.
   * TODO: change democracy API to return the endpoint url from a config name
   * @param _url the URL of an endpoint
   * @param _account {account} created by `keys.create()`
   */
  static createSignerEth(_url, _account) {
    assert(isAccount(_account))
    const privatePrefixed = _account.get('privatePrefixed')
    const addressPrefixed = _account.get('addressPrefixed')
    const provider = new SignerProvider(_url, {
      signTransaction: (rawTx, cb) => cb(null, ethsign(rawTx, privatePrefixed)),
      accounts: (cb) => cb(null, [addressPrefixed]),
    })
    return new Eth(provider)
  }

  createSignerEth(_url) {
    return Wallet.createSignerEth(_url, this.account)
  }

}

const get = async (address) => {
  const eth = getNetwork()
  const chainId = await eth.net_version()
  const account = getImmutableKey(`/keys/${chainId}/${address}`, null)
  if (!account) { throw new Error(`Account not found for ${address}`) }
  assert(isAccount(account))
  return account
}

const set = async (account) => {
  const eth = getNetwork()
  const chainId = await eth.net_version()
  const address = account.get('addressPrefixed')
  return setImmutableKey(`/keys/${chainId}/${address}`, account)
}

const pay = async ({eth, weiValue, fromAddress, toAddress}) => {
  const txHash = await eth.sendTransaction({
    value: weiValue,
    data : "0x",
    from : fromAddress,
    to   : toAddress,
    nonce: await eth.getTransactionCount(fromAddress),
  })
  return txHash
}

module.exports = {
  Wallet: Wallet,
  pay   : pay,
  set   : set,
  get   : get,
}
