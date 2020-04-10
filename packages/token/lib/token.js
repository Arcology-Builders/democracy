
'use strict'

const token = {}

const BN = require('bn.js')
const { assert } = require('chai')
const { List, Range } = require('immutable')
const { getNetwork, getImmutableKey : get, setImmutableKey : set, fromJS, Logger } = require('demo-utils')
const { RemoteDB } = require('demo-client')
const { keccak256 } = require('ethereumjs-util')
const { padLeft } = require('web3-utils')

const LOGGER = new Logger('token')
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

token.init = () => {
  if (!token.rdb) {
    token.rdb = new RemoteDB('api.etherscan.io', 443, true)
  }
  if (! ETHERSCAN_API_KEY) {
    throw new Error('Set the environment variable ETHERSCAN_API_KEY')
  }
  token.eth = getNetwork()
}

token.getContractABI = async (tokenAddress) => {
  const responseString = await token.rdb.getHTTP(
    `/api?module=contract&action=getabi&address=${tokenAddress}&apikey=${ETHERSCAN_API_KEY}`
  )
  const response = JSON.parse(responseString)
  assert.equal(response['status'], '1', 'Invalid response status from Etherscan API.')
  assert.equal(response['message'], 'OK', 'Invalid reponse message from Etherscan API')
  return JSON.parse(response['result'])
}

token.getTransferEventTopic = () => {
  // This should be ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
  return '0x' + keccak256('Transfer(address,address,uint256)').toString('hex')
}

token.getLogsFromBlock = async (blockNumber) => {
  assert(BN.isBN(blockNumber), 'blockNumber is not a BN')
  try {
    const cachedLogs = await get(`blockLogs/${blockNumber}`, null)
    LOGGER.info('Return cached for block ' + blockNumber)
    return cachedLogs
  } catch(e) {
  }
  const block = await token.eth.getBlockByNumber(blockNumber, true)
  const txCount = block.transactions.length
  LOGGER.info('txCount', txCount, blockNumber)
  
  const promList = Range(0, txCount).map(async (i) => {
    const tx = await token.eth.getTransactionByBlockNumberAndIndex(blockNumber, i)
    const rx = await token.eth.getTransactionReceipt(tx.hash)
    if (rx['logs'].length > 0) {
      return fromJS( rx['logs'] )
    } else {
      return fromJS( [] )
    }
  })
  const logEvents = await Promise.all(promList.toJS())
  const blockLogs = logEvents.reduce((sum, logs) => {
    return sum.merge(logs)
  }, List() )
  if (!set(`blockLogs/${blockNumber}`, blockLogs)) {
    throw Error('Cannot write logs for block ' + blockNumber)
  }
  return blockLogs
}

token.filterLogs = async (logs, toAddress, contractAddress) => {
  const TRANSFER_TOPIC = token.getTransferEventTopic()
  const TO_TOPIC = padLeft(toAddress, 64)

  const filteredLogs = logs.filter((x) => 
    (x.get('address') === contractAddress) &&
    (x.get('topics').get(0) === TRANSFER_TOPIC) &&
    (x.get('topics').get(2) === TO_TOPIC)
  )
  //filteredLogs.map((x) => console.log('From Address ' + x.get('transactionHash')+ ' ' + x.get('blockNumber').toString() + ' ' + x.get('topics').get(1)))

  return filteredLogs
}

token.getLogsFromAllBlocks = async (startBlockNumber, endBlockNumber, contractAddress) => {
  assert(BN.isBN(startBlockNumber), 'blockNumber is not a BN')
  let i = startBlockNumber
  let allLogs = List()

  const lastBlockNumber = endBlockNumber || await token.eth.blockNumber()

  // Keep running up until the very latest block number in the last iteration
  while (i.lte(lastBlockNumber)) {
    const latestLogs = await token.getLogsFromBlock(i)
    allLogs = allLogs.merge(latestLogs.filter((x) => {
      return x.get('address') === contractAddress
    }))
    i = i.add(new BN(1))
    if (i.mod(new BN(100)).eq(new BN(0))) {
      LOGGER.info('Retrieving logs from block ' + i)
    }
  }
  return allLogs
}

token.getAllFromAddresses = async (tokenAddress, toAddress, startBlockNumber, endBlockNumber) => {
  const allLogs = await token.getLogsFromAllBlocks(startBlockNumber, endBlockNumber, tokenAddress)
  const filteredLogs = await token.filterLogs(allLogs, toAddress, tokenAddress)
  return filteredLogs.map((x) => '0x' + x.get('topics').get(1).slice(26))
}

token.scanEvents = async (eth, tokenAddress) => {
  const lastMetadata = get('tokens/lastMetadata', null)
  const startBlockNumber = lastMetadata ? lastMetadata['lastBlockNumber'] : 0
  let blockNumber = startBlockNumber
  let lastBlockNumber = await eth.getBlock()
}

module.exports = token