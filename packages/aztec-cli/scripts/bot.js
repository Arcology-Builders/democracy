#!/usr/bin/env node
'use strict'
const { mint }      = require('../src/mint')
const { Map }       = require('immutable')
const BN            = require('bn.js')
const { wallet }    = require('demo-keys')
const { getConfig } = require('demo-utils')
const { toWeit }    = require('web3-utils')

const { CommandLineClient } = require('darkchat')

class DarkBotClient extends CommandLineClient {
  constructor() {
    super({
      host : 'capetown.arcology.nyc',
      port : 8545,
    })
    this.requests = 0
    this.lock = 0
  }

  // Call start() after instantiating it
  async start() {
    // Add CLI TCP socket specific client logger and connection logic
    this.client.connect(this.port, this.host, ()=>{
      console.log(`Client connected to: ${this.host}:${this.port}`)
    })

    return new Promise((resolve, reject) => {
      this.client.on('connect', resolve);
    })
  }

}

const c = new DarkBotClient()

c.addMessageListener(async (_data) => {
  const data = JSON.parse(_data.toString())
  if (!data.msg) {
    console.log('Received empty message' + JSON.stringify(data))
  }
  if (data.msg.startsWith('mint')) {
    const requestNum = this.requests
    this.requests += 1
    const tokens = data.msg.split(' ')
    const result = await mintFromMessage({
      tradeSymbol     : tokens[1],
      mintAmount      : new BN(tokens[2]),
      minteeAddress   : tokens[3],
      minteePublicKey : tokens[4],
    })
    const { minteeNoteHash } = result.toJS() 
    c.client.write(JSON.stringify({
      minteeNoteHash,
      requestNum,
      timestamp: Date.now(),
    }).toString())
  }
  else if (data.msg.startsWith('topup')) {
    const requestNum = this.requests
    this.requests += 1
    const tokens = data.msg.split(' ')
    const balance = 
    const result = await topUpFromMessage({
      payeeAddress    : tokens[1],
    })
    const { txHash } = result.toJS() 
    c.client.write(JSON.stringify({
      txNoteHash,
      requestNum,
      timestamp: Date.now(),
    }).toString())
  }
})

const mintFromMessage = async ({
  minteeAddress, minteePublicKey, mintFromZero=false, mintAmount, tradeSymbol
}) => {
  console.log(`Address   : ${minteeAddress}`)
  console.log(`Public Key: ${minteePublicKey}`)

  const config = getConfig()
  const deployerAddress = config['DEPLOYER_ADDRESS']
  const deployerPassword = config['DEPLOYER_PASSWORD']

  const result = await mint(Map({
    tradeSymbol      : tradeSymbol || 'AAA',
    minteeAddress    : minteeAddress,
    minteePublicKey  : minteePublicKey,
    deployerAddress  : deployerAddress,
    deployerPassword : deployerPassword,
    minteeAmount     : mintAmount || new BN(0),
    mintFromZero     : mintFromZero,
  }))

  console.log('minteeNoteHash', result.get('minteeNoteHash'))
  console.log('Minting complete.')
  wallet.shutdownSync()
  return result
}

const topUpFromMessage = async ({
  payeeAddress
}) => {
  console.log(`Address   : ${minteeAddress}`)
  console.log(`Public Key: ${minteePublicKey}`)

  const config = getConfig()
  const deployerAddress = config['DEPLOYER_ADDRESS']
  const deployerPassword = config['DEPLOYER_PASSWORD']

  const balance = new BN(await eth.getBalance(payeeAddress))
  const limit = new BN(toWei('0.1', 'ether'))

  if (balance.lt(limit)) {

    const { signerEth } = await wallet.prepareSigner({
      deployerAddress,
      deployerPassword,
    })

    await wallet.init()

    const result = await wallet.pay({
      minteeAddress    : minteeAddress,
      minteePublicKey  : minteePublicKey,
      fromAddress  : deployerAddress,
      toAddress : payeeAddress,
      payAmount : PAY_AMOUNT
      deployerPassword : deployerPassword,
      minteeAmount     : mintAmount || new BN(0),
      mintFromZero     : mintFromZero,
    })

  console.log('minteeNoteHash', result.get('minteeNoteHash'))
  console.log('Minting complete.')
  wallet.shutdownSync()
  return result
}

const main = async () => {
    await c.start()
    await new Promise((resolve, reject) => {
      setTimeout(async () => {
        await c.client.write(JSON.stringify({
          type: 'join', cname: 'zktransfer', uname: 'darkbot'
        }))
        await c.client.write(JSON.stringify({
          type: 'msg', uname: 'darkbot', msg: 'DARKBOT LIVES'
        }).toString())
        resolve()
      }, 1000)
    })
}

main().then(() => console.log("Exited"))
