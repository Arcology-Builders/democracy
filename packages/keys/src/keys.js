const keythereum = require('@invisible-college/keythereum')
const utils = require('ethereumjs-utils')
const { Map } = require('immutable')
const assert = require('chai').assert
const bops = require('bops')
const randombytes = require('randombytes')

const PARAMS = { keyBytes: 32, ivBytes: 16 };

const create = () => {
  const account = keythereum.create(PARAMS)
  const privateBuffer = account.privateKey
  const publicBuffer = utils.privateToPublic(account.privateKey)
  const addressBuffer = utils.privateToAddress(account.privateKey)

  return bufferToMap(privateBuffer, publicBuffer, addressBuffer, account.iv, account.salt)
}

const bufferToMap =
  (_privateBuffer, _publicBuffer, _addressBuffer, _ivBuffer, _saltBuffer) => {
 
  assert.equal(_ivBuffer.length, PARAMS.ivBytes)
  assert.equal(_saltBuffer.length, PARAMS.keyBytes)

  const privateString = hex(_privateBuffer)
  const publicString  = hex(_publicBuffer)
  const addressString = hex(_addressBuffer)
  const ivString      = hex(_ivBuffer)
  const saltString    = hex(_saltBuffer)

  return new Map({
    privateString   : privateString,
    publicString    : publicString,
    addressString   : addressString,
    ivString        : ivString,
    saltString      : saltString,
    privatePrefixed : prefix(privateString),
    publicPrefixed  : prefix(publicString),
    addressPrefixed : prefix(addressString),
  })
}

const createFromPrivateString = (_privateString) => {
  const privateBuffer = Buffer.from(bops.from(_privateString, 'hex'))
  const publicBuffer = utils.privateToPublic(privateBuffer)
  const addressBuffer = utils.privateToAddress(privateBuffer)
  const ivBuffer = randombytes(PARAMS.ivBytes)
  const keyBuffer = randombytes(PARAMS.keyBytes)
  return bufferToMap(privateBuffer, publicBuffer, addressBuffer, ivBuffer, keyBuffer)
}

const createFromPrivateBuffer = (_privateBuffer, _ivBuffer, _saltBuffer) => {
  const publicBuffer = utils.privateToPublic(_privateBuffer)
  const addressBuffer = utils.privateToAddress(_privateBuffer)
  return bufferToMap(_privateBuffer, publicBuffer, addressBuffer, _ivBuffer, _saltBuffer)
}

const isAccount = (_map) => {

  return (Map.isMap(_map)             &&
          _map.get('privateString'  ) &&
          _map.get('publicString'   ) &&
          _map.get('addressString'  ) &&
          _map.get('privatePrefixed') &&
          _map.get('publicPrefixed' ) &&
          _map.get('addressPrefixed') &&
          utils.isValidPrivate(bops.from(_map.get('privateString'), 'hex')) &&
          utils.isValidPublic(bops.from(_map.get('publicString'), 'hex'))   &&
          utils.isValidAddress(_map.get('addressPrefixed'))
         )
}

var OPTIONS = {
  kdf: "pbkdf2",
  cipher: "aes-128-ctr",
  kdfparams: {
    c: 262144,
    dklen: 32,
    prf: "hmac-sha256"
  }
}

const accountToEncryptedJSON = (_account, _password) => {
  return keythereum.dump(_password, buffer(_account.get('privateString')),
    buffer(_account.get('saltString')), buffer(_account.get('ivString')), OPTIONS)
}

const encryptedJSONToAccount = (_keyObject, _password) => {
  const privateBuffer = keythereum.recover(_password, _keyObject)
  const ivString = _keyObject.crypto.cipherparams.iv
  assert.equal(ivString.length, PARAMS.ivBytes * 2)
  const saltString = _keyObject.crypto.kdfparams.salt 
  assert.equal(saltString.length, PARAMS.keyBytes * 2)
  return createFromPrivateBuffer(privateBuffer, buffer(ivString), buffer(saltString))
}

const hex = (_buffer) => {
  return _buffer.toString('hex')
}

const buffer = (_hex) => {
  return bops.from(_hex, 'hex')
}

const prefix = (_str) => {
  return '0x' + _str
}

module.exports = {
  isAccount              : isAccount,
  create                 : create,
  createFromPrivateString: createFromPrivateString,
  accountToEncryptedJSON : accountToEncryptedJSON,
  encryptedJSONToAccount : encryptedJSONToAccount,
}
