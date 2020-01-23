// Retry logic 
'use strict'

const MAX_RETRY_COUNT = 20
const { Logger } = require('demo-utils')
const LOGGER = new Logger('mined')

const mined = {}

mined.untilTxMined = async ({ txHash, eth }) => {
  let receipt
  const retryFunc = async (txHash, resolve, reject, retryCount) => {
    if (retryCount > MAX_RETRY_COUNT) {
      reject(`Max retry count ${MAX_RETRY_COUNT} exceeded waiting for tx receipt.`)
    }
    try {
      receipt = await eth.getTransactionReceipt(txHash)
      if (receipt === null) {
        setTimeout(() => retryFunc(txHash, resolve, reject, retryCount+1), 1000)
      } else {
        resolve(receipt)
      }
    } catch(e) {
      reject(e)
    }
  }
  return new Promise((resolve, reject) => {
    retryFunc(txHash, resolve, reject, 0)
  })
}

module.exports = mined
