'use strict';

const assert = require('chai').assert

const { getNetwork, isNetwork, getEndpointURL } = require('demo-utils')
const { isAccount, Wallet }      = require('demo-keys')
const { toHex, toWei }   = require('web3-utils')

const eth = getNetwork()
const { Map } = require('immutable')

/**
 * A manager of Ethereum transactions associated with a particular sender account.
 */
class Transactor {
  
  /**
   * @param _ethSender a signer-provider associated with a sender account
   * @param _gasPrice a string number indicating the desired gas price for this network in gwei
   */
  constructor({ethSender, gasPrice}) {
    //this.senderAccount = senderAccount
    //assert(isNetwork(ethSender))
    this.eth = ethSender
    //Wallet.createSignerEth(getEndpointURL(), senderAccount)
    this.gasPrice = gasPrice
  }

  async getGasEstimate({fromAddress, toAddress, value, data}) {
    return eth.estimateGas({
      from  : fromAddress,
      to    : toAddress,
      value : value,
      data  : data,
    })
  }

  async createRawTx({fromAddress, toAddress, value, data}) {
    assert(data.slice(0,2) === '0x')
    assert(data.length === 74)
    const chainId = await this.eth.net_version()
    const gas = await this.getGasEstimate(...arguments)
    return {
      nonce   : await this.eth.getTransactionCount(fromAddress),
      gas     : Number(Math.floor(Number(gas) * 1.1)).toString(16),
      gasPrice: toHex(toWei(this.gasPrice, 'gwei')),
      data    : data,
      from    : fromAddress,
      to      : toAddress,
      value   : value,
      chainId : toHex(chainId),
    }
  }

  async sendSignedTxFromArgs({fromAddress, toAddress, value, data}) {
    const rawTx = createRawTx(arguments)
    const txPromise = this.eth.sendTransaction(rawTx)
    const txHash = await txPromise
    return txHash
  } 

  /**
   * Send this given raw TX signed from this transactor's sender account
   * @param _rawTx
   */
  async sendSignedTx(rawTx) {
    const txPromise = this.eth.sendTransaction(rawTx)
    const txHash = await txPromise
    return txHash
  }

}

module.exports = {
  Transactor      : Transactor,
}
