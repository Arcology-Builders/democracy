// EIP712 signing of trades
'use strict'

const { Map } = require('immutable')
const typedData = require('@aztec/typed-data')
const secp256k1 = require('@aztec/secp256k1')
const abi = require('ethereumjs-abi')
const util = require('ethereumjs-util')
const { createTransformFromMap, makeMapType } = require('demo-transform')
const { Logger, timeStampSecondsToBlockNumber } = require('demo-utils')
const { AZTEC_TYPES: TYPES } = require('./utils')
const { padRight } = require('web3-utils');

const LOGGER = new Logger('eip712')

const DOMAIN_SALT = '0x655a1a74fefc4b03038d941491a1d60fc7fbd77cf347edea72ca51867fb5a3dc'
const DOMAIN_TYPEHASH = abi.soliditySHA3(["string"],["EIP712Domain(string name,string version,uint256 chainId,address verifyingContract,bytes32 salt)"])
const TRADE_TYPE = "Trade(address sellerAddress,address bidderAddress,address sellerTokenAddress,address bidderTokenAddress,bytes32 sellerInputNoteHash,bytes32 bidderOutputNoteHash,bytes32 bidderInputNoteHash,bytes32 sellerOutputNoteHash,uint256 saleExpireBlockNumber,uint256 bidExpireBlockNumber)";
const TRADE_TYPEHASH = abi.soliditySHA3(["string"],[ TRADE_TYPE ])

const getDomainData = (chainId, verifyingContract) => {
  return {
    name              : "Democracy.js Linked Trade Validator",
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
    TRADE_TYPEHASH               ,
    message.sellerAddress        ,
    message.bidderAddress        ,
    message.sellerTokenAddress   ,
    message.bidderTokenAddress   ,
    message.sellerInputNoteHash  ,
    message.bidderOutputNoteHash ,
    message.bidderInputNoteHash  ,
    message.sellerOutputNoteHash ,
    message.saleExpireBlockNumber,
    message.bidExpireBlockNumber ,
  ] 
  LOGGER.info('Message Hash', params)
  return abi.soliditySHA3(
    [
      'bytes32',
      'address',
      'address',
      'address',
      'address',
      'bytes32',
      'bytes32',
      'bytes32',
      'bytes32',
      'uint256',
      'uint256',
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
  jsProofData : TYPES.hexPrefixed,
}), 'signBidderMapType')

const signTypedDataTransform = createTransformFromMap({
  func: async ({
    bidder,
    seller,
    chainId,
    proxy,
    wallet,
    deployed,
    saleExpireTimeSeconds,
    bidExpireTimeSeconds,
  }) => {
    const validator = await deployed('TradeValidator')
    const tradeUtils = await deployed('TradeUtils')
    const paramUtils = await deployed('ParamUtils')

    const bidExpireBlockNumber  = await timeStampSecondsToBlockNumber(bidExpireTimeSeconds)
    const saleExpireBlockNumber = await timeStampSecondsToBlockNumber(saleExpireTimeSeconds)

    const domainData = getDomainData(chainId, validator.address)
    const domainSeparator = getDomainSeparator(domainData)
    const message = {
      sellerAddress         : seller.address,
      bidderAddress         : bidder.address,
      sellerTokenAddress    : seller.zkToken.address,
      bidderTokenAddress    : bidder.zkToken.address,
      sellerInputNoteHash   : seller.jsSenderNote.noteHash,
      bidderOutputNoteHash  : seller.jsReceiverNote.noteHash,
      bidderInputNoteHash   : bidder.jsSenderNote.noteHash,
      sellerOutputNoteHash  : bidder.jsReceiverNote.noteHash,
      saleExpireBlockNumber,
      bidExpireBlockNumber,
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
      validator,
      tradeUtils,
      paramUtils,
      finalHash       : finalHash.toString('hex'),
      messageHash     : messageHash.toString('hex'),
      DOMAIN_TYPEHASH : DOMAIN_TYPEHASH.toString('hex'),
      TRADE_TYPEHASH  : TRADE_TYPEHASH.toString('hex'),
      DOMAIN_SALT     : DOMAIN_SALT.slice(2),
      domainSeparator : domainSeparator.toString('hex'),
      saleExpireBlockNumber,
      bidExpireBlockNumber,
    })
  },
  inputTypes: Map({
    'bidder'         : signBidderMapType,
    'seller'         : signSellerMapType,
    'chainId'        : TYPES.string,
    'proxy'          : TYPES.contractInstance,
    'deployed'       : TYPES['function'],
    'wallet'         : TYPES.wallet,
    'saleExpireTimeSeconds' : TYPES.integer,
    'bidExpireTimeSeconds'  : TYPES.integer,
  }),
  outputTypes: Map({
    'validator'             : TYPES.contractInstance,
    'paramUtils'            : TYPES.contractInstance,
    'tradeUtils'            : TYPES.contractInstance,
    'sigR'                  : TYPES.keccak256Hash,
    'sigS'                  : TYPES.keccak256Hash,
    'sigV'                  : TYPES.integer,
    'DOMAIN_TYPEHASH'       : TYPES.keccak256Hash,
    'DOMAIN_SALT'           : TYPES.keccak256Hash,
    'TRADE_TYPEHASH'        : TYPES.keccak256Hash,
    'finalHash'             : TYPES.keccak256Hash,
    'messageHash'           : TYPES.keccak256Hash,
    'domainData'            : TYPES.any,
    'domainSeparator'       : TYPES.keccak256Hash,
    'saleExpireBlockNumber' : TYPES.bn,
    'bidExpireBlockNumber'  : TYPES.bn,
  }),
})

module.exports = { signTypedDataTransform }
