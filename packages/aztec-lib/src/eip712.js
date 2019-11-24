// EIP712 signing of trades
'use strict'

const { Map } = require('immutable')
const typedData = require('@aztec/typed-data')
const secp256k1 = require('@aztec/secp256k1')
const abi = require('ethereumjs-abi')
const util = require('ethereumjs-util')
const { createTransformFromMap, makeMapType } = require('demo-transform')
const { Logger } = require('demo-utils')
const { AZTEC_TYPES: TYPES } = require('./utils')
const { padRight } = require('web3-utils');

const LOGGER = new Logger('eip712')

const DOMAIN_SALT = '0x2c0839bc15be62d229094ac4709dd2f8fa39d56d8d25d29c580ca773fd195ddb'
const DOMAIN_TYPEHASH = abi.soliditySHA3(["string"],["EIP712Domain(string name,string version,uint256 chainId,address verifyingContract,bytes32 salt)"])
const BID_TYPEHASH = abi.soliditySHA3(["string"],["Bid(bytes32 sellerNoteHash,bytes32 bidderNoteHash,bytes proofData"])

const getDomainData = (chainId, verifyingContract) => {
  return {
    name              : "Democracy.js",
    version           : "1",
    chainId           : parseInt(chainId, 10),
    verifyingContract : verifyingContract,
    salt              : DOMAIN_SALT,
  }
}

const getDomainSeparator = (domainData) => {
  const params = [
    DOMAIN_TYPEHASH,
    util.keccak256(domainData.name),
    util.keccak256(domainData.version),
    domainData.chainId,
    domainData.verifyingContract,
    domainData.salt,
  ]
  LOGGER.info('Domain Separator Params', params)

  return abi.soliditySHA3(['bytes32','bytes32','bytes32','uint256','address','bytes32'],
    params)
}

const getMessageHash = (message) => {
  const params = [
    BID_TYPEHASH,
    message.sellerNoteHash,
    message.bidderNoteHash,
    Buffer.from(message.jsProof_BidderToSeller.slice(2), 'hex'),
  ] 
  LOGGER.info('Message Hash', params)
  return abi.soliditySHA3(
    [
      'bytes32',
      'bytes32',
      'bytes32',
      'bytes',
    ],
    params
  )
}

const getTypeHash = (typeName, type) => {
  const typeString = type.map((name,type) => name + ' ' + type + ',' )
  return typeName + '(' + typeString.slice(0, typeString.length-1) + ')'
}

const signSellerMapType = makeMapType(Map({
  address  : TYPES.ethereumAddress,
  zkToken  : TYPES.contractInstance,
  noteHash : TYPES.aztecNoteHash,
}), 'signSellerMapType')

const signBidderMapType = makeMapType(Map({
  address     : TYPES.ethereumAddress,
  zkToken     : TYPES.contractInstance,
  noteHash    : TYPES.aztecNoteHash,
  jsProofData : TYPES.string,
}), 'signBidderMapType')

const signTypedDataTransform = createTransformFromMap({
  func: async ({
    bidder,
    seller,
    chainId,
    proxy,
    wallet,
  }) => {

    const domainData = getDomainData(chainId, proxy.address)
    const domainSeparator = getDomainSeparator(domainData)
    const message = {
      sellerNoteHash         : seller.noteHash,
      bidderNoteHash         : bidder.noteHash,
      jsProof_BidderToSeller : bidder.jsProofData,
    }
    const messageHash = getMessageHash(message)
    const finalHash = abi.soliditySHA3(
      ['bytes2','bytes32','bytes32'],
      [Buffer.from([0x19, 0x01]),domainSeparator,messageHash]
    )
    const bidderAccount = wallet.getAccountSync(bidder.address)
    LOGGER.info('bidderAccount', bidderAccount)
    const privateKey = bidderAccount.get('privateString')
    
    const sig = util.secp256k1.sign(finalHash, Buffer.from(privateKey, 'hex'))
    const sigR = sig.signature.slice(0, 32).toString('hex')
    const sigS = sig.signature.slice(32, 64).toString('hex')
    const sigV = sig.recovery + 27

    return Map({
      sigR,
      sigS,
      sigV,
      finalHash       : finalHash.toString('hex'),
      messageHash     : messageHash.toString('hex'),
      DOMAIN_TYPEHASH : DOMAIN_TYPEHASH.toString('hex'),
      BID_TYPEHASH    : BID_TYPEHASH.toString('hex'),
      DOMAIN_SALT     : DOMAIN_SALT.slice(2),
      domainSeparator : domainSeparator.toString('hex'),
    })
  },
  inputTypes: Map({
    'bidder'         : signBidderMapType,
    'seller'         : signSellerMapType,
    'chainId'        : TYPES.string,
    'proxy'          : TYPES.contractInstance,
    'wallet'         : TYPES.wallet,
  }),
  outputTypes: Map({
    'sigR'             : TYPES.keccak256Hash,
    'sigS'             : TYPES.keccak256Hash,
    'sigV'             : TYPES.integer,
    'DOMAIN_TYPEHASH'  : TYPES.keccak256Hash,
    'DOMAIN_SALT'      : TYPES.keccak256Hash,
    'BID_TYPEHASH'     : TYPES.keccak256Hash,
    'finalHash'        : TYPES.keccak256Hash,
    'messageHash'        : TYPES.keccak256Hash,
    'domainData'       : TYPES.any,
    'domainSeparator'  : TYPES.keccak256Hash,
  }),
})

module.exports = { signTypedDataTransform }
