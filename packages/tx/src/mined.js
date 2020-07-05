// Retry logic 
'use strict'

const MAX_RETRY_COUNT = 20
const { Logger, getConfig } = require('demo-utils')
const LOGGER = new Logger('mined')

const mined = {}

// In milliseconds, 15 is default block time for Ethereum
const TX_RETRY_TIMEOUT = 15000

mined.untilTxMined = async ({ txHash, eth }) => {
  let receipt
  const retryFunc = async (txHash, resolve, reject, retryCount) => {
    if (retryCount > MAX_RETRY_COUNT) {
      reject(`Max retry count ${MAX_RETRY_COUNT} exceeded waiting for tx receipt.`)
    }
    try {
      LOGGER.debug(`Retrying to mine txHash ${txHash} count ${retryCount}`)
      receipt = await eth.getTransactionReceipt(txHash)
      
      if (receipt === null) {
        setTimeout(() => retryFunc(txHash, resolve, reject, retryCount+1), TX_RETRY_TIMEOUT)
      } else if (receipt.status !== '0x1') {
        LOGGER.error(`Tx was mined but had failed status: ${JSON.stringify(receipt)}`)
        reject(`Tx was mined but had failed status: ${JSON.stringify(receipt)}`)
      } else {
        LOGGER.debug(`Tx mined ${JSON.stringify(receipt)}`)
        resolve(receipt)
      }
    } catch(e) {
      LOGGER.error(`Tx failed to be mined with error${e && e.msg}`)
      reject(`Tx failed to be mined with error${e && e.msg}`)
    }
  }
  return new Promise((resolve, reject) => {
    retryFunc(txHash, resolve, reject, 0)
  })
}

module.exports = mined
