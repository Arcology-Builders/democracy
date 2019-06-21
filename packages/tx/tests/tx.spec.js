const utils = require('demo-utils')
const { getConfig, getNetwork, getEndpointURL, Logger } = utils

const txs = require('../src/tx')
const { wallet, create, pay }
             = require('demo-keys')
const assert = require('chai').assert
const { BuildsManager, Linker, Deployer, isDeploy, Contract }
             = require('demo-contract')
const LOGGER = new Logger('tx.spec')
const { toWei, toHex } = require('web3-utils')
const BN = require('bn.js')
const abi = require('ethjs-abi')
const { isValidAddress, toChecksumAddress } = require('ethereumjs-util')

describe( 'transaction sender', () => {

  let contract
  let deploy
  let bm
  let accounts
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
    eth = getNetwork()
    chainId = await eth.net_version()
    accounts = await eth.accounts()
    await wallet.init({autoConfig: false})
    let { address, password } = await wallet.createEncryptedAccount()
    assert( wallet.accountsMap[address],
           `Newly created account is not mapped to address ${address}`)
    senderAddress = address
    senderPassword = password
    assert( isValidAddress(senderAddress),
           `Newly created account has invalid address ${senderAddress}` )
    signerEth = await wallet.createSignerEth({
      url: getEndpointURL(), address: senderAddress })
    bm = new BuildsManager({
      sourcePathList: ['node_modules/demo-test-contracts/contracts'],
      chainId: chainId
    })
    const d = new Deployer({
      eth            : eth,
      bm             : bm,
      chainId        : chainId,
      address        : accounts[7],
    })
    deploy = await d.deploy( 'DifferentSender', 'link', 'deploy' ) 
    assert( isDeploy(deploy), `DifferentSender-deploy not found.` )
    contract = new Contract({ deployerEth: signerEth, deploy: deploy })

    const data = contract.getMethodCallData('send', [accounts[2]])
    deployAddress = deploy.get('deployAddress')
    tx = await txs.createRawTx({
      from  : senderAddress,
      to    : deployAddress,
      value : toWei('0.001', 'ether'),
      data  : data,
    })
  })

  it( 'estimates gas for a contract' , async () => {
    const methodObj = contract.getABIObjectByName('send')
    const gas = await txs.getGasEstimate({
      from  : accounts[1],
      to    : deploy.get('deployAddress'),
      value : '10000',
      data  : contract.getMethodCallData('send', [accounts[2]])
    })
    assert((gas >= 83370) && (gas <= 83443))
  })

  it( 'creates a raw tx' , async () => {
    const hexChainId = '0x' + Number(chainId).toString(16)
    const methodObj = contract.getABIObjectByName('send')
    const expected = abi.encodeMethod(methodObj, [accounts[2]])
    const nonce = await eth.getTransactionCount(senderAddress)
    const value = toWei("0.001", "ether")
    const gasPrice = toHex(toWei(String(getConfig()['GAS_PRICE']), 'gwei'))
    LOGGER.info('GAS PRICE', gasPrice)
    assert( new BN(tx.gas).gte(new BN('16644')), `${tx.gas} is not >= 16644` )
    assert( new BN(tx.gas).lte(new BN('0x1668b')), `${tx.gas} is not >= 0x1668b` )
    assert.equal(JSON.stringify(tx),
      `{"nonce":"${nonce}","gas":"${toHex(tx.gas).slice(2)}",` +
      `"gasPrice":"${gasPrice}","data":"${expected}",`+
      `"from":"${senderAddress}","to":`+
      `"${deployAddress}","value":"${value}","chainId":"${hexChainId}"}`
    )
  })

  it( 'sends a signed tx', async () => {
    await wallet.payTest({
      weiValue    : toWei('2', 'ether'),
      fromAddress : accounts[7],
      toAddress   : senderAddress,
    })
    await wallet.unlockEncryptedAccount({
      address: senderAddress, password: senderPassword })
    assert.equal(signerEth.address, senderAddress)
    txHash = await txs.sendSignedTx({ rawTx: tx, signerEth: signerEth })

    await eth.getTransactionReceipt(txHash)
    const owner = await contract.instance.owner()
    assert.equal( owner['0'], accounts[7] )
    const lastPayer = await contract.instance.lastPayer()
    assert.equal( lastPayer['0'], accounts[2] )
    const lastValue = await contract.instance.lastValue()
    assert.equal( lastValue['0'].toString(), toWei('0.001', 'ether') )
    const lastSender = await contract.instance.lastSender()
    assert.equal( toChecksumAddress(lastSender['0']), senderAddress )

    await contract.getTxReceipt({
      method   : contract.instance.send,
      args     : [accounts[3]],
      options  : { from: accounts[3], value: toWei('0.01', 'ether') }
    })
    const owner2 = await contract.instance.owner()
    assert.equal( owner2['0'], accounts[7] )
    const lastPayer2 = await contract.instance.lastPayer()
    assert.equal( lastPayer2['0'], accounts[3] )
    const lastValue2 = await contract.instance.lastValue()
    assert.equal( lastValue2['0'].toString(), toWei('0.01', 'ether') )
    const lastSender2 = await contract.instance.lastSender()
    assert.equal( toChecksumAddress(lastSender2['0']), signerEth.address )
   
  })

  after(async () => {
    await bm.cleanDeploy('DifferentSender-deploy')
  })

})
    
