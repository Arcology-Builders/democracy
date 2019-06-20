'use strict'
const utils   = require('ethereumjs-utils')
const { Map } = require('immutable')
const assert  = require('chai').assert

const { Logger } = require('demo-utils')
const LOGGER     = new Logger('keys')

const keys = {}
keys.keythereum  = require('keythereum')
keys.randombytes = require('randombytes')
keys.Buffer      = Buffer

/**
 * Key and initialization vector lengths for Ethereum account generation.
 * @memberof module:keys
 */
keys.PARAMS = { keyBytes: 32, ivBytes: 16 }

/**
 * Create a new account map with private key, public key, address, salt, and init vector.
 *
 * @method create
 * @memberof module:keys
 * @return an Immutable {Map} representing an Ethereum account.
 */
keys.create = () => {
  const account = keys.keythereum.create(keys.PARAMS)
  const privateString = account.privateKey.toString('hex') 
  const ivString      = keys.hex(account.iv)
  const saltString    = keys.hex(account.salt)
  return keys.createFromPrivateString(privateString, ivString, saltString)
}

/**
 * Convert the given buffers to an Immutable {Map}
 *
 * @method bufferToMap
 * @memberof module:keys
 * @param _privateBuffer Buffer of a private key (non-prefixed)
 * @param _publicBuffer Buffer of an Ethereum public key (non-prefixed)
 * @param _addressBuffer Buffer of an Ethereum address (non-prefixed)
 * @param _ivBuffer Buffer of an initialization vector
 * @param _saltBuffer Buffer of a password salt
 * @return an Immutable {Map} representing an Ethereum account.
 */
keys.bufferToMap =
  (_privateBuffer, _publicBuffer, _addressBuffer, _ivBuffer, _saltBuffer) => {
 
    assert.equal(_ivBuffer.length, keys.PARAMS.ivBytes)
    assert.equal(_saltBuffer.length, keys.PARAMS.keyBytes)

    const privateString = keys.hex(_privateBuffer)
    const publicString  = keys.hex(_publicBuffer)
    const addressPrefixed = utils.toChecksumAddress(keys.hex(_addressBuffer))
    const ivString      = keys.hex(_ivBuffer)
    const saltString    = keys.hex(_saltBuffer)

    return new Map({
      privateString,
      publicString,
      addressString   : addressPrefixed.slice(2),
      ivString,
      saltString,
      privatePrefixed : keys.prefixed(privateString),
      publicPrefixed  : keys.prefixed(publicString),
      addressPrefixed,
    })
  }

/**
 * @method createFromPrivateString
 * @memberof module:keys
 * @param _privateString {String} an Ethereum private key, not prefixed with `0x`
 * @return an Immutable {Map} representing an Ethereum account associated with the given
 * private key string.
 */
keys.createFromPrivateString = (privateString, ivString, saltString) => {
  const privateBuffer = keys.buffer(privateString)  
  assert(utils.isValidPrivate(privateBuffer))
  const publicBuffer = utils.privateToPublic(privateBuffer)
  const addressBuffer = utils.privateToAddress(privateBuffer)
  const _ivString = ivString || keys.hex(keys.randombytes(keys.PARAMS.ivBytes))
  const _saltString = saltString || keys.hex(keys.randombytes(32))

  const privatePrefixed = keys.prefixed(privateString)
  const publicPrefixed  = keys.prefixed(publicBuffer.toString('hex'))
  const addressPrefixed = utils.toChecksumAddress(addressBuffer.toString('hex'))

  return Map({
    privatePrefixed,
    publicPrefixed,
    addressPrefixed,
    privateString,
    publicString    : publicPrefixed.slice(2),
    addressString   : addressPrefixed.slice(2),
    ivString        : _ivString,
    saltString      : _saltString,
  })
}

/**
 * @method createFromPrivateBuffer
 * @memberof module:keys
 * @param _privateBuffer {Buffer} the private Ethereum key
 * @param _ivBuffer {Buffer} the initialization vector from private key generation
 * @param _salt {Buffer} a random salt for later enciphering.
 * @return an Immutable {Map} representing an Ethereum account associated with the given
 * private parameters.
 */
keys.createFromPrivateBuffer = (_privateBuffer, _ivBuffer, _saltBuffer) => {
  const publicBuffer = utils.privateToPublic(_privateBuffer)
  const addressBuffer = utils.privateToAddress(_privateBuffer)
  return keys.bufferToMap(_privateBuffer, publicBuffer, addressBuffer, _ivBuffer, _saltBuffer)
}

/**
 * @method isAccount
 * @memberof module:keys
 * @return true if the given object is an Immutable {Map} representing an Ethereum account.
 */
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

/**
 * Keythereum options for enciphered password dumps and loads.
 * @property OPTIONS
 * @memberof module:keys
 */
keys.OPTIONS = {
  kdf: 'pbkdf2',
  cipher: 'aes-128-ctr',
  kdfparams: {
    c: 262144,
    dklen: 32,
    prf: 'hmac-sha256'
  }
}

/**
 * @method accountToEncryptedJSON
 * @memberof module:keys
 * @param account an Immutable {Map} the Ethereum account to encipher.
 * @param password {String} a password to create an encrypted dump with Keythereum.
 * @return a JSON file representing the given Ethereum account in encipher form.
 */
keys.accountToEncryptedJSON = ({ account, password }) => {
  return keys.keythereum.dump( password,
    keys.buffer(account.get('privateString')),
    keys.buffer(account.get('saltString')),
    keys.buffer(account.get('ivString')), keys.OPTIONS)
}

/**
 * @method encryptedJSONToAccount
 * @memberof module:keys
 * @param encryptedJSON {JSON} the enciphered form of an Ethereum account
 * @param password {String} for deciphering the encrypted JSON.
 * @return an Immutable {Map} representing the deciphered Ethereum account.
 */
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

/**
 * @method hex
 * @memberof module:keys
 * @return the given buffer as a hex string (without a `0x` prefix)
 */
keys.hex = (_buffer) => {
  return _buffer.toString('hex')
}

/**
 * @method buffer
 * @memberof module:keys
 * @return the given hex string as a browser-friendly Buffer
 */
keys.buffer = (_hex) => {
  return keys.keythereum.str2buf(_hex, 'hex')
}

/**
 * @method prefixed
 * @memberof module:keys
 * @return the given string with a `0x` prefix
 */
keys.prefixed = (_str) => {
  return '0x' + _str
}

module.exports = keys
