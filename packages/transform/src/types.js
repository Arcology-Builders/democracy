const { isValidChecksumAddress } = require('ethereumjs-util')
const BN = require('bn.js')
const { TYPES }  = require('demo-state')
const { assert } = require('chai')
const { Map, List }    = require('immutable')
const { wallet } = require('demo-keys')
const { isDeploy } = require('demo-contract')
const { makeRequired, makeOptional } = require('demo-state')

const types = {}

types.subStateKey = (subStateLabel, bareKey) => {
  return (subStateLabel) ?
        subStateLabel + bareKey[0].toUpperCase() + bareKey.slice(1) :
        bareKey
}

const HEX_CHARS = '01234567890abcdef'

types.isHexPrefixed = (obj) => {
  const allHexChars = (s,v,k) => Boolean(s && HEX_CHARS.search(v.toLowerCase()) > -1)
  return (typeof(obj) === 'string') && (obj.slice(0,2) === '0x') &&
    List(obj.slice(2)).reduce(allHexChars, true)
}

const contractCheckerFunc = (obj) =>  
  Boolean(obj && isDeploy(obj.deploy) && obj.deployerEth['prepareSignerEth'])

const contractInstanceCheckerFunc = (obj) =>
  Boolean(obj && obj['abi'] && isValidChecksumAddress(obj['address']))

const DEMO_CHECKER_FUNCS = Map({
  'function'        : (obj) => (typeof(obj) === 'function'),
  'ethereumTxHash'  : (obj) => (isHexPrefixed(obj) && obj.length === 66),
  'ethereumAddress' : (obj) => isValidChecksumAddress(obj),
  'ethereumSigner'  : (obj) => Boolean(obj && obj['net_version']),
  'contract'        : contractCheckerFunc,
  'contractInstance': contractInstanceCheckerFunc,
  'bm'              : (obj) => Boolean(obj && obj['getDeploys']),
  'wallet'          : (obj) => Boolean(obj && obj['prepareSignerEth']),
  'array'           : (obj) => Array.isArray(obj),
  'bn'              : (obj) => BN.isBN(obj),
  'any'             : (obj) => true,
})

types.DEMO_TYPES = DEMO_CHECKER_FUNCS.map((checker, typeName) => {
  const requiredChecker = makeRequired(checker, typeName)
  requiredChecker.opt = makeOptional(checker, typeName)
  return requiredChecker
}).merge(TYPES).toJS()

module.exports = types
