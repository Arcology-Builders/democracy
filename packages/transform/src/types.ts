const { isValidChecksumAddress } = require('ethereumjs-util')
const BN = require('bn.js')
const { TYPES }  = require('demo-state')
const { assert } = require('chai')
const { Map, List }    = require('immutable')
const { wallet } = require('demo-keys')
const { isDeploy } = require('demo-contract')
const { makeRequired, makeOptional, ArgCheckerFunc } = require('./transform')

export const subStateKey = (subStateLabel: string, bareKey: string) => {
  return (subStateLabel) ?
        subStateLabel + bareKey[0].toUpperCase() + bareKey.slice(1) :
        bareKey
}

const HEX_CHARS = '01234567890abcdef'

export const isHexPrefixed = (obj: any) => {
  const allHexChars = (s: boolean , v: string, k: number) => Boolean(s && HEX_CHARS.search(v.toLowerCase()) > -1)
  return (typeof(obj) === 'string') && (obj.slice(0,2) === '0x') &&
    List(obj.slice(2)).reduce(allHexChars, true)
}

const contractCheckerFunc = (obj: any) =>  
  Boolean(obj && isDeploy(obj.deploy) && obj.deployerEth['prepareSignerEth'])

const contractInstanceCheckerFunc = (obj: any) =>
  Boolean(obj && obj['abi'] && isValidChecksumAddress(obj['address']))

const DEMO_CHECKER_FUNCS = Map({
  'function'        : (obj: any) => (typeof(obj) === 'function'),
  'ethereumTxHash'  : (obj: any) => (isHexPrefixed(obj) && obj.length === 66),
  'ethereumAddress' : (obj: any) => isValidChecksumAddress(obj),
  'ethereumSigner'  : (obj: any) => Boolean(obj && obj['net_version']),
  'contract'        : contractCheckerFunc,
  'contractInstance': contractInstanceCheckerFunc,
  'bm'              : (obj: any) => Boolean(obj && obj['getDeploys']),
  'wallet'          : (obj: any) => Boolean(obj && obj['prepareSignerEth']),
  'array'           : (obj: any) => Array.isArray(obj),
  'bn'              : (obj: any) => BN.isBN(obj),
  'any'             : (obj: any) => true,
})

export const DEMO_TYPES = DEMO_CHECKER_FUNCS.map((checker: (obj: any) => boolean, typeName: string) => {
  const requiredChecker = makeRequired(checker, typeName)
  requiredChecker.opt = makeOptional(checker, typeName)
  return requiredChecker
}).merge(TYPES).toJS()
