const { isValidChecksumAddress } = require('ethereumjs-util')
const BN = require('bn.js')
const { TYPES }  = require('demo-state')
const { assert } = require('chai')
const { Map }    = require('immutable')
const { wallet } = require('demo-keys')
const { makeRequired, makeOptional } = require('demo-state')

const HEX_CHARS = '01234567890abcdef'

const isHexPrefixed = (obj) => {
  return (typeof(obj) === 'string') && (obj.slice(0,2) === '0x') &&
    obj.reduce((s,v,k) => Boolean(s && HEX_CHARS.search(v.toLowerCase()) > 0), true)
}

const DEMO_CHECKER_FUNCS = Map({
  'function'        : (obj) => (typeof(obj) === 'function'),
  'ethereumTxHash'  : (obj) => (isHexPrefixed(obj) && obj.length === 66),
  'ethereumAddress' : (obj) => isValidChecksumAddress(obj),
  'ethereumSigner'  : (obj) => Boolean(obj && obj['net_version']),
  'bm'              : (obj) => Boolean(obj && obj['getDeploys']),
  'wallet'          : (obj) => Boolean(obj && obj['prepareSignerEth']),
  'array'           : (obj) => Array.isArray(obj),
  'bn'              : (obj) => BN.isBN(obj),
  'any'             : (obj) => true,
})

const DEMO_TYPES = DEMO_CHECKER_FUNCS.map((checker, typeName) => {
  const requiredChecker = makeRequired(checker, typeName)
  requiredChecker.opt = makeOptional(checker, typeName)
  return requiredChecker
}).merge(TYPES).toJS()

module.exports = {
  DEMO_TYPES
}
