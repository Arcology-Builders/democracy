const assert = require('chai').assert

const contracts = require('..')
const { Contract, BuildsManager, Deployer, Linker, Compiler } = require('..')
const { getNetwork, Logger } = require('demo-utils')
const { wallet } = require('demo-keys')
const LOGGER = new Logger('contract.spec')
const abi = require('ethjs-abi')
const { toWei } = require('web3-utils')

describe( 'Contract parent class', () => {

  let c
  let bm
  let accounts
  let deployerEth
  let deployerAddress

  before(async () => {
    const eth = getNetwork()
    accounts = await eth.accounts()
    const chainId = await eth.net_version() 
    bm = new BuildsManager({
      autoConfig: true,
      sourcePathList: ['../../node_modules/demo-test-contracts/contracts'],
      chainId: chainId
    })
    await bm.cleanLink( 'DifferentSender-link' )
    await bm.cleanDeploy( 'DifferentSender-deploy' )
    const d = new Deployer({bm: bm, eth: eth, chainId: chainId, address: accounts[0]})
    const l = new Linker({bm: bm, chainId: chainId})
    const link = await l.link( 'DifferentSender', 'link' ) 
    const deploy = await d.deploy( 'DifferentSender', 'link', 'deploy' ) 
    await wallet.init({ unlockSeconds: 2 })
    const { signerEth, address, password } = await wallet.prepareSignerEth({})
    deployerEth = signerEth
    deployerAddress = address
    await wallet.payTest({
      fromAddress : accounts[0],
      toAddress   : address,
      weiValue    : toWei('0.1', 'ether'),
    })
    await contracts.init()
    c = new Contract({ deployerEth: deployerEth, deploy: deploy, deployerAddress: deployerAddress })
  })

  it( ' gets an ABI object ', async () => {
    const methodObj = c.getABIObjectByName('send')
    assert(methodObj.type === 'function')
    const data = c.getMethodCallData('send', [accounts[1]])
    const expected = abi.encodeMethod(methodObj, [accounts[1]])
    assert.equal(data, expected)
    //'0x3e58c58c0000000000000000000000004da976e02013ed8ff393a2d74e219cbb1f49c049')
  })

  it( 'calls a contract object', async () => {
    const receipt = await c.getTxReceipt({
      method: c.instance.send, args: [accounts[7]], options: {from: accounts[6]} })
    LOGGER.info('receipt', receipt)
    const nonce = await deployerEth.getTransactionCount(deployerAddress)
    assert(nonce, 1)
    assert.typeOf(receipt.transactionHash, 'string')
    assert.equal(receipt.transactionHash.length, 66)
    const lastPayer = await c.instance.lastPayer()
    assert.equal(lastPayer[0], accounts[7])
  })
/*
  TODO: Move autocreation and this test into demo-depart or a
        more appropriate module.
  it( 'auto creates a new contract from name', async () => {
    const c2 = await contracts.createContract('DifferentSender')
    await c2.getTxReceipt({
      method: c2.instance.send, args: [accounts[9]], options: {from: accounts[6]} })
    const lastPayer = await c2.instance.lastPayer()
    assert.equal(lastPayer[0], accounts[9])
  })
*/
  after(async () => {
    await bm.cleanLink( 'DifferentSender-link' )
    await bm.cleanDeploy( 'DifferentSender-deploy' )
  })

}) 
