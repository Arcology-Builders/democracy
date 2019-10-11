const { isValidChecksumAddress } = require('ethereumjs-util')

const { TYPES }  = require('demo-state')
const { assert } = require('chai')
const { Map }    = require('immutable')
const { wallet } = require('demo-keys')
const { makeRequired, makeOptional } = require('demo-state')

const DEMO_CHECKER_FUNCS = Map({
  'ethereumAddress' : (obj) => isValidChecksumAddress(obj),
  'ethSigner'       : (obj) => obj['net_version'],
  'wallet'          : (obj) => wallet['prepareSignerEth'],
})

const DEMO_TYPES = DEMO_CHECKER_FUNCS.map((checker, typeName) => {
  const requiredChecker = makeRequired(checker, typeName)
  requiredChecker.opt = makeOptional(checker, typeName)
  return requiredChecker
}).merge(TYPES).toJS()

module.exports = {
  DEMO_TYPES
}
