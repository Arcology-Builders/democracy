'use strict'
const utils = require('demo-utils')
const { getConfig, getNetwork, getEndpointURL, Logger } = utils

const txs = require('..')
const { wallet, create, pay }
             = require('demo-keys')
const assert = require('chai').assert
const { BuildsManager, Linker, Deployer, isDeploy, Contract }
             = require('demo-contract')
const LOGGER = new Logger('mined.spec')
const { toWei } = require('ethjs-unit')
const { intToHex } = require('ethjs-util')
const BN = require('bn.js')
const abi = require('ethjs-abi')
const { isValidAddress, toChecksumAddress } = require('ethereumjs-util')

describe( 'transaction mining retryer', () => {

  let contract
  let deploy
  let bm
  let tx
  let txHash
  let senderAccount
  let senderPassword
  let senderAddress
  let deployAddress
  let eth
  let signerEth
  let chainId

  before(async () => {
    process.env.NODE_ENV = 'RINKEBY'
    eth = getNetwork()
    chainId = await eth.net_version()
    await wallet.init({autoConfig: false, unlockSeconds: 100})
    senderAddress = getConfig()['DEPLOYER_ADDRESS']
    senderPassword = getConfig()['DEPLOYER_PASSWORD']
    assert( isValidAddress(senderAddress),
           `Newly created account has invalid address ${senderAddress}` )
    let { signerEth: signerEth2 } = await wallet.prepareSignerEth({
      password: senderPassword, address: senderAddress })
    signerEth = signerEth2
    assert( signerEth.net_version, 'signerEth does not have net_version' )
    bm = new BuildsManager({
      sourcePathList: ['node_modules/demo-test-contracts/contracts'],
      chainId: chainId
    })
    const d = new Deployer({
      eth            : signerEth,
      bm             : bm,
      chainId        : chainId,
      address        : senderAddress,
    })
    deploy = await d.deploy( 'DifferentSender', 'link', 'deploy' ) 
    assert( isDeploy(deploy), `DifferentSender-deploy not found.` )
    contract = new Contract({ deployerEth: signerEth, deploy: deploy })

    const data = contract.getMethodCallData('send', [senderAddress])
    deployAddress = deploy.get('deployAddress')
    tx = await txs.createRawTx({
      from  : senderAddress,
      to    : deployAddress,
      value : toWei('0.001', 'ether'),
      data  : data,
    })
  })

  it( 'sends a signed tx', async () => {
    assert( wallet.getAccountSync(senderAddress, true),
           `Newly created account is not mapped to address ${senderAddress}`)
    assert(signerEth.net_version, 'signerEth is not found')
    assert.equal(signerEth.address, senderAddress)
    txHash = await txs.sendSignedTx({ rawTx: tx, signerEth: signerEth })

    await txs.untilTxMined({ txHash, eth })
    const owner = await contract.instance.owner()
    assert.equal( toChecksumAddress(owner['0']), senderAddress )
  })

  after(async () => {
    await bm.cleanDeploy('DifferentSender-deploy')
    wallet.shutdownSync()
  })

})
    
