const assert = require('chai').assert

const { Contract, BuildsManager, Deployer, Linker, Compiler } = require('..')
const { getNetwork, Logger, getImmutableKey, setImmutableKey } = require('demo-utils')
const LOGGER = new Logger('contract.spec')
const abi = require('ethjs-abi')

describe( 'Contract parent class', () => {

  let c
  let bm
  let accounts

  before(async () => {
    const eth = getNetwork()
    accounts = await eth.accounts()
    const chainId = await eth.net_version() 
    bm = new BuildsManager({
      startSourcePath: 'node_modules/@democracy.js/test-contracts/contracts',
      chainId: chainId,
      inputter: async (key, def) => { return new Promise((resolve, reject) => { setTimeout(() => { resolve(getImmutableKey(key, def)) }, 1000) }) },
      outputter: async (key, val, ow) => { return new Promise((resolve, reject) => { setTimeout(() => { resolve(setImmutableKey(key, val, ow)) }, 1000) }) },
    })
    await bm.cleanLink( 'DifferentSender-link' )
    await bm.cleanDeploy( 'DifferentSender-deploy' )
    const d = new Deployer({bm: bm, eth: eth, chainId: chainId, address: accounts[0]})
    const l = new Linker({bm: bm, chainId: chainId})
    const link = await l.link( 'DifferentSender', 'link' ) 
    const deploy = await d.deploy( 'DifferentSender', 'link', 'deploy' ) 
    c = new Contract(eth, deploy)
  })

  it( ' gets an ABI object ', async () => {
    const methodObj = c.getABIObjectByName('send')
    assert(methodObj.type === 'function')
    const data = c.getMethodCallData('send', [accounts[1]])
    const expected = abi.encodeMethod(methodObj, [accounts[1]])
    assert.equal(data, expected)
    //'0x3e58c58c0000000000000000000000004da976e02013ed8ff393a2d74e219cbb1f49c049')
  })

  after(async () => {
    await bm.cleanLink( 'DifferentSender-link' )
    await bm.cleanDeploy( 'DifferentSender-deploy' )
  })

}) 
