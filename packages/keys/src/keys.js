const keythereum = require('@invisible-college/keythereum')
const utils = require('ethereumjs-utils')
const { Map } = require('immutable')
const assert = require('chai').assert
const bops = require('bops')

const create = () => {
  const account = keythereum.create()
  const privateBuffer = account.privateKey
  const publicBuffer = utils.privateToPublic(account.privateKey)
  const addressBuffer = utils.privateToAddress(account.privateKey)

  return bufferToMap(privateBuffer, publicBuffer, addressBuffer)
}

const bufferToMap = (_privateBuffer, _publicBuffer, _addressBuffer) => {
  
  const privateString = hex(_privateBuffer)
  const publicString  = hex(_publicBuffer)
  const addressString = hex(_addressBuffer)

  return new Map({
    privateBuffer   : _privateBuffer,
    publicBuffer    : _publicBuffer,
    addressBuffer   : _addressBuffer,
    privateString   : privateString,
    publicString    : publicString,
    addressString   : addressString,
    privatePrefixed : prefix(privateString),
    publicPrefixed  : prefix(publicString),
    addressPrefixed : prefix(addressString),
  })
}

const createFromPrivateString = (_privateString) => {
  const privateBuffer = bops.from(_privateString, 'hex')
  const publicBuffer = utils.privateToPublic(privateBuffer)
  const addressBuffer = utils.privateToAddress(privateBuffer)
  return bufferToMap(privateBuffer, publicBuffer, addressBuffer)
}

const isAccount = (_map) => {
  assert(utils.isValidPrivate(_map.get('privateBuffer')))
  assert(utils.isValidPublic(_map.get('publicBuffer')))
  assert(utils.isValidAddress(_map.get('addressPrefixed')))

  return (Map.isMap(_map)             &&
          _map.get('privateBuffer'  ) &&
          _map.get('publicBuffer'   ) && 
          _map.get('addressBuffer'  ) &&
          _map.get('privateString'  ) &&
          _map.get('publicString'   ) &&
          _map.get('addressString'  ) &&
          _map.get('privatePrefixed') &&
          _map.get('publicPrefixed' ) &&
          _map.get('addressPrefixed')
         )
}

const hex = (_buffer) => {
  return _buffer.toString('hex')
}

const prefix = (_str) => {
  return '0x' + _str
}

module.exports = {
  isAccount              : isAccount,
  create                 : create,
  createFromPrivateString: createFromPrivateString
}
