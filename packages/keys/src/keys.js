const keythereum = require('keythereum')
const utils = require('ethereumjs-utils')
const { Map } = require('immutable')
const assert = require('chai').assert

const create = () => {
  const account = keythereum.create()
  const privateKey = account.privateKey.toString('hex')
  const publicKey = utils.privateToPublic(account.privateKey).toString('hex')
  const address = utils.privateToAddress(account.privateKey).toString('hex')

  const privateKeyString = hex(privateKey)
  const publicKeyString  = hex(publicKey)
  const addressString    = hex(address)

  return new Map({
    privateKey         : privateKey,
    publicKey          : publicKey,
    address            : address,
    privateKeyString   : privateKeyString,
    publicKeyString    : publicKeyString,
    addressString      : addressString,
    privateKeyPrefixed : prefix(privateKeyString),
    publicKeyPrefixed  : prefix(publicKeyString),
    addressPrefixed    : prefix(addressString),
  })
}

const hex = (_buffer) => {
  return _buffer.toString('hex')
}

const prefix = (_str) => {
  return '0x' + _str
}

module.exports = {
  create: create
}
