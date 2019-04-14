const { Contract, BuildsManager, Deployer, Linker, Compiler } = require('..')
const { getNetwork } = require('@democracy.js/utils')

describe( 'Contract parent class', () => {

  let c
  let bm

  before(async () => {
    const eth = getNetwork()
    const accounts = await eth.accounts()
    const chainId = await eth.net_version() 
    bm = new BuildsManager({
      startSourcePath: 'node_modules/@democracy.js/test-contracts/contracts',
      chainId: chainId
    })
    await bm.cleanLink( 'DifferentSender-link' )
    await bm.cleanDeploy( 'DifferentSender-deploy' )
    const d = new Deployer({bm: bm, eth: eth, chainId: chainId, deployerAddress: accounts[0]})
    const l = new Linker({bm: bm, chainId: chainId})
    const link = await l.link( 'DifferentSender', 'link' ) 
    const deploy = await d.deploy( 'DifferentSender', 'link', 'deploy' ) 
    c = new Contract(eth, deploy)
  })

  it( ' gets an ABI object ', async () => {
    })

  after(async () => {
    await bm.cleanLink( 'DifferentSender-link' )
    await bm.cleanDeploy( 'DifferentSender-deploy' )
  })

}) 
