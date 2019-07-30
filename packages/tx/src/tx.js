'use strict';

const assert = require('chai').assert

const { getNetwork, getConfig, isNetwork, getEndpointURL, Logger, toJS }
             = require('demo-utils')
const LOGGER = new Logger('tx')
const { intToHex }
             = require('ethjs-util')
const { encodeMethod }
             = require('ethjs-abi')
const { toWei }
             = require('ethjs-unit')
const BN     = require('bn.js')

const tx = {}

/**
 * Estimate the amount of gas that would be consumed by this tx.
 *
 * @method getGasEstimate
 * @memberof module:tx
 * @param from {String} `0x`-prefixed Ethereum address as sender of tx
 * @param to {String} `0x`-prefixed Ethereum address as receiver of tx
 * @param value {String} in wei
 * @param data {String} ABI-encoded data for a tx
 */
tx.getGasEstimate = async ({from, to, value, data, eth }) => {
  const _eth = eth || getNetwork()
  return _eth.estimateGas({
    from  : from,
    to    : to,
    value : value,
    data  : data,
  })
}

tx.getABIObjectByName = (abi, name) => {
  const matches = abi.filter((obj) => (obj.get('name') === name))
  assert( matches.count() === 1)
  const methodObj = matches.first()
  assert(methodObj.get('type') === 'function')
  return methodObj 
}

tx.getMethodCallData = (abi, name, args) => {
  const methodObj = tx.getABIObjectByName(abi, name)
  return encodeMethod(toJS( methodObj ), args.toJS())
}

tx.createRawTx = async function({ from, to, value, data, gasPrice, eth }) {
  const _gasPrice = gasPrice || getConfig()['GAS_PRICE']
  assert(data.slice(0,2) === '0x')
  //assert(data.length === 74)
  const _eth = eth || getNetwork()
  const chainId = await _eth.net_version()
  const gas = await tx.getGasEstimate(...arguments)
  const gasEstimate = new BN(Math.floor(Number(gas) * 1.1))
  return {
    nonce   : await _eth.getTransactionCount(from),
    gas     : intToHex( gasEstimate ),
    gasPrice: intToHex( toWei(String(_gasPrice), 'gwei') ),
    data    : data,
    from    : from,
    to      : to,
    value   : value ? value.toString() : '',
    chainId : intToHex( Number(chainId).toString(16) ),
  }
}

tx.sendSignedTxFromArgs = async function ({ from, to, value, data, signerEth }) {
  const rawTx = tx.createRawTx(arguments)
  const eth = signerEth || getNetwork()
  return await eth.sendTransaction(rawTx)
} 

tx.call = async function ({ data, from, to, value, gasPrice, signerEth }) {
  const _gas = await tx.getGasEstimate(...arguments)
  const _gasPrice = gasPrice || getConfig()['GAS_PRICE']
  return await tx.sendSignedTxFromArgs(...arguments,
                                       { from: from, to: to, value: value, data: data,
                                         gas: _gas, gasPrice: _gasPrice })
}

/**
 * Send this given raw TX signed from this transactor's sender account
 * @param _rawTx
 */
tx.sendSignedTx = async ({ rawTx, signerEth }) => {
  const eth = signerEth || getNetwork()
  LOGGER.debug('rawTx', rawTx)
  return await eth.sendTransaction(rawTx)
}

module.exports = tx
