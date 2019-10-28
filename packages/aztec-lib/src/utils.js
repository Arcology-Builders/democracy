'use strict'

const { toJS, fromJS } = require('demo-utils')
const { isAccount }    = require('demo-keys')
const { Contract }     = require('demo-contract')
const { DEMO_TYPES: TYPES, makeRequired, makeOptional }
                       = require('demo-transform')

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

const aztecNoteHashCheckerFunc = (obj) => {
  if (typeof(obj) !== 'string') {
    return {error: `aztecNoteHash is not a string`}
  }
  if (obj.length !== 66) {
    return {error: `aztecNoteHash has length ${obj.length} instead of 66`}
  }
  if (obj.slice(0,2) !== '0x') {
    return {error: `aztecNoteHash does not begin with 0x`}
  }
  return {}
}

const aztecPublicNoteCheckerFunc = (obj) => {
  const { publicKey, viewingKey, k, a, noteHash } = obj
  return (
    typeof(publicKey) === 'string' &&
    publicKey.length === 200 &&
    publicKey.slice(0,2) === '0x' &&
    viewingKey === '0x' &&
    k === '0x' &&
    a === '0x' &&
    aztecNoteHashCheckerFunc(noteHash)
  ) 
}

const aztecPrivateNoteCheckerFunc = (obj) => {
  const { publicKey, viewingKey, k, a, noteHash } = obj
  return (
    typeof(publicKey) === 'string' &&
    publicKey.length === 200 &&
    publicKey.slice(0,2) === '0x' &&
    typeof(viewingKey) === 'string' &&
    viewingKey.length === 140 &&
    viewingKey.slice(0,2) === '0x' &&
    typeof(k) === 'string' &&
    k.length === 64 &&
    typeof(a) === 'string' &&
    a.length === 64 &&
    aztecNoteHashCheckerFunc(noteHash)
  ) 
}

const AZTEC_CHECKER_FUNCS = Map({
  'aztecPublicKey'   : aztecPublicKeyCheckerFunc  ,
  'aztecNoteHash'    : aztecNoteHashCheckerFunc   ,
  'aztecPublicNote'  : aztecPublicNoteCheckerFunc ,
  'aztecPrivateNote' : aztecPrivateNoteCheckerFunc,
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
  const deployedContract =
    await bm.getDeploy(deployName)
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

module.exports = utils
