const utils = require('ethereumjs-utils')
const { Map } = require('immutable')
const assert = require('chai').assert

const { Logger } = require('demo-utils')
const LOGGER = new Logger('keys')

const keys = {}
keys.keythereum = require('keythereum')
keys.randombytes = require('randombytes')
keys.Buffer = Buffer

keys.PARAMS = { keyBytes: 32, ivBytes: 16 };

keys.create = () => {
  const account = keys.keythereum.create(keys.PARAMS)
  const privateBuffer = account.privateKey
  const publicBuffer = utils.privateToPublic(account.privateKey)
  const addressBuffer = utils.privateToAddress(account.privateKey)

  return keys.bufferToMap(privateBuffer, publicBuffer, addressBuffer,
                          account.iv, account.salt)
}

keys.bufferToMap =
  (_privateBuffer, _publicBuffer, _addressBuffer, _ivBuffer, _saltBuffer) => {
 
  assert.equal(_ivBuffer.length, keys.PARAMS.ivBytes)
  assert.equal(_saltBuffer.length, keys.PARAMS.keyBytes)

  const privateString = keys.hex(_privateBuffer)
  const publicString  = keys.hex(_publicBuffer)
  const addressString = keys.hex(_addressBuffer)
  const ivString      = keys.hex(_ivBuffer)
  const saltString    = keys.hex(_saltBuffer)

  return new Map({
    privateString   : privateString,
    publicString    : publicString,
    addressString   : addressString,
    ivString        : ivString,
    saltString      : saltString,
    privatePrefixed : keys.prefix(privateString),
    publicPrefixed  : keys.prefix(publicString),
    addressPrefixed : keys.prefix(addressString),
  })
}

keys.createFromPrivateString = (_privateString) => {
  const privateBuffer = Buffer.from(_privateString, 'hex')
  const publicBuffer = utils.privateToPublic(privateBuffer)
  const addressBuffer = utils.privateToAddress(privateBuffer)
  const ivBuffer = keys.randombytes(keys.PARAMS.ivBytes)
  const keyBuffer = keys.randombytes(keys.PARAMS.keyBytes)
  return keys.bufferToMap(privateBuffer, publicBuffer, addressBuffer, ivBuffer, keyBuffer)
}

keys.createFromPrivateBuffer = (_privateBuffer, _ivBuffer, _saltBuffer) => {
  const publicBuffer = utils.privateToPublic(_privateBuffer)
  const addressBuffer = utils.privateToAddress(_privateBuffer)
  return keys.bufferToMap(_privateBuffer, publicBuffer, addressBuffer, _ivBuffer, _saltBuffer)
}

keys.isAccount = (_map) => {

  return (Map.isMap(_map)             &&
          _map.get('privateString'  ) &&
          _map.get('publicString'   ) &&
          _map.get('addressString'  ) &&
          _map.get('privatePrefixed') &&
          _map.get('publicPrefixed' ) &&
          _map.get('addressPrefixed') &&
          utils.isValidPrivate(Buffer.from(_map.get('privateString'), 'hex')) &&
          utils.isValidPublic(Buffer.from(_map.get('publicString'), 'hex'))   &&
          utils.isValidAddress(_map.get('addressPrefixed'))
         )
}

keys.OPTIONS = {
  kdf: "pbkdf2",
  cipher: "aes-128-ctr",
  kdfparams: {
    c: 262144,
    dklen: 32,
    prf: "hmac-sha256"
  }
}

keys.accountToEncryptedJSON = ({ account, password }) => {
  return keys.keythereum.dump( password,
    keys.buffer(account.get('privateString')),
    keys.buffer(account.get('saltString')),
    keys.buffer(account.get('ivString')), keys.OPTIONS)
}

keys.encryptedJSONToAccount = ({ encryptedJSON, password }) => {
  LOGGER.debug('encryptedJSONToAccount', encryptedJSON, password)
  const privateBuffer = keys.keythereum.recover(password, encryptedJSON)
  const ivString = encryptedJSON.crypto.cipherparams.iv
  assert.equal(ivString.length, keys.PARAMS.ivBytes * 2)
  const saltString = encryptedJSON.crypto.kdfparams.salt 
  assert.equal(saltString.length, keys.PARAMS.keyBytes * 2)
  return keys.createFromPrivateBuffer(
    privateBuffer, keys.buffer(ivString), keys.buffer(saltString))
}

keys.hex = (_buffer) => {
  return _buffer.toString('hex')
}

keys.buffer = (_hex) => {
  return keys.keythereum.str2buf(_hex, 'hex')
}

keys.prefix = (_str) => {
  return '0x' + _str
}

module.exports = keys
