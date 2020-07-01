'use strict'

const { toJS, fromJS } = require('demo-utils')
const { isAccount }    = require('demo-keys')
const { Contract }     = require('demo-contract')
const { TYPES, makeRequired, makeOptional, isHexPrefixed }
                       = require('demo-transform')

const { note } = require('aztec.js')
const { publicToAddress, isValidPublic }
                       = require('ethereumjs-util')
const { Map }          = require('immutable')
const { assert }       = require('chai')

const utils = {}

const aztecPublicKeyCheckerFunc = (obj) => {
  if (typeof(obj) !== 'string') {
    return {error: 'aztecPublicKey not a string'}
  }
  if (obj.length !== 132) {
    return {error: `aztecPublicKey has length ${obj.length} instead of 132`}
  }
  if (obj.slice(0,4) !== '0x04') {
    return {error: `aztecPublicKey did not begin with 0x04`}
  }
  if (!isValidPublic(Buffer.from(obj.slice(4), 'hex'))) {
    return {error: `aztecPublicKey is not a hex string`}
  }
  return {}
}

const aztecNoteHashCheckerFunc = (obj) => isHexPrefixed(obj, 66)

const checkJsonHexStrings = (label, obj, tuples ) => {
  const hexChecker = ({ key, length, prefixed }) => {
    const result = isHexPrefixed(obj[key], length, prefixed)
    return (result['error']) ?
      { error: `${label}.${key} for length ${length} mismatches hex string with error ${result['error']} ` } :
      {}
  }
  // Return the first error found
  return tuples.reduce((s, tuple) => {
    return (s['error']) ? s : hexChecker(tuple)
  }, {})
}

const aztecPublicNoteCheckerFunc = (obj) => {

  return checkJsonHexStrings('aztecPublicNote', obj, [
    { key : 'publicKey'  , length : 200, prefixed : true },
    { key : 'viewingKey' , length : 2  , prefixed : true },
    { key : 'k'          , length : 2  , prefixed : true },
    { key : 'a'          , length : 2  , prefixed : true },
    { key : 'noteHash'   , length : 66 , prefixed : true },
  ])

}

const aztecPrivateNoteCheckerFunc = (obj) => {

  return checkJsonHexStrings('aztecPrivateNote', obj, [
    { key : 'viewingKey' , length : 140 , prefixed : true },
    { key : 'k'          , length : 64 , prefixed : false },
    { key : 'a'          , length : 64 , prefixed : false },
    { key : 'noteHash'   , length : 66 , prefixed : true },
  ])

}

const tradeSymbolCheckerFunc = (obj) => {
  if (typeof(obj) !== 'string') {
    return {error: `${obj} should be a string`}
  }
  if (obj.length < 2 || obj.length > 4) {
    return {error: `${obj.length} should be between 2 and 4` }
  }
  return {}
}

const hexPrefixedCheckerFunc = (obj) => {
  if (isHexPrefixed(obj)) {
  }
}

const AZTEC_CHECKER_FUNCS = Map({
  'aztecPublicKey'   : aztecPublicKeyCheckerFunc  ,
  'aztecNoteHash'    : aztecNoteHashCheckerFunc   ,
  'aztecPublicNote'  : aztecPublicNoteCheckerFunc ,
  'aztecPrivateNote' : aztecPrivateNoteCheckerFunc,
  'tradeSymbol'      : tradeSymbolCheckerFunc     ,
})

utils.AZTEC_TYPES = AZTEC_CHECKER_FUNCS.map((checker, typeName) => {
  const requiredChecker = makeRequired(checker, typeName)
  requiredChecker.opt = makeOptional(checker, typeName)
  return requiredChecker
}).merge(TYPES).toJS()

// Webified version of `deployed` in demo-depart
utils.deployed = async ({ contractName, options={}, bm, signerEth }) => {
  const { deployID, abi } = options
  const _deployId = deployID ? deployID : 'deploy'
  // Eventually replace this part with a proper call to deployer
  const deployName = `${contractName}-${_deployId}`
  console.log('Deploy Name', deployName)
  const deployedContract = await bm.getDeploy(deployName)
  const replacedContract = (abi) ?
    deployedContract.set( 'abi', fromJS( abi ) ) : deployedContract 
  console.log('Deployer Address', signerEth.address)
  const contract = new Contract({
    deployerEth: signerEth, deploy: replacedContract })
  return await contract.getInstance()
}

/**
 * Verify that the given AZTEC public key matches the given address
 */
utils.checkPublicKey = ({ aztecPublicKey, address }) => {
  // Create a non-AZTEC (uncompressed) public key for verifying address
  assert.equal( aztecPublicKey.length, 132 )
  const normalPublicKey = '0x' + aztecPublicKey.slice(4)
  assert.equal( normalPublicKey.length, 130 )
  assert( publicToAddress(normalPublicKey), address,
    `Receiver address ${address} doesn't match public key ${normalPublicKey}` )
}

utils.getAztecPublicKey = ({ address, wallet }) => {
  // For some reason, in the browser the accountsMap uses normal JS objects not Immutable Maps
  const account = wallet.getAccountSync(address, true)

  const publicString = Map.isMap(account) ?
    account.get('publicString') : account.publicString
  return '0x04' + publicString
}

// This is sync, but we'll call it async to make it consistent
utils.exportAztecPublicNote = async (fullNote) => {
  return note.fromPublicKey(fullNote.exportNote().publicKey).exportNote()
}

utils.exportAztecPrivateNote = async (fullNote) => {
  return (await note.fromViewKey(fullNote.exportNote().viewingKey)).exportNote()
}

module.exports = utils
