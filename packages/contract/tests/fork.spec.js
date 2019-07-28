const { Deployer, Linker, isLink, isDeploy, Contract, createBM } = require('..')
const { getNetwork, Logger } = require('demo-utils')
const { Map } = require('immutable')

const LOGGER = new Logger('fork.spec')

const chai = require('chai').use(require('chai-as-promised'));
const assert = chai.assert
const BN = require('bn.js')

let networkId

describe('Democracy forking', () => {

  let eth
  let accounts
  let d
  let bm
  let deploy
  let deploy2

  before(async () => {
    eth = getNetwork()
    accounts = await eth.accounts()
    networkId = await eth.net_version()
    d = new Deployer({bm: bm, eth: eth, chainId: networkId, address: accounts[0] })
    // bm = await createBM({chainId: networkId, sourcePathList: ['contracts'], autoConfig: true})
    bm = d.getBuildsManager()
    l = new Linker({bm: bm, chainId: networkId})
    // No remote cleaning allowed
    //await bm.cleanDeploy( 'DifferentSender-deploy' )
    //await bm.cleanLink( 'DifferentSender-link' )
  })

  it( 'creates two forked deploys' , async () => {
    const link = await l.link( 'DifferentSender','link' )
    deploy = await d.deploy('DifferentSender', 'link', 'deploy', Map({}), true)
    deploy2 = await d.deploy('DifferentSender', 'link', 'deploy', Map({}), true)
    LOGGER.info('deploy1 time', deploy.get('deployTime') )
    LOGGER.info('deploy2 time', deploy2.get('deployTime') )
    assert( deploy.get('deployTime') < deploy2.get('deployTime') )
  })

  it( 'sends different values on different forks', async () => {
    const c  = new Contract({ deployerEth: eth, deploy: deploy })
    const c2 = new Contract({ deployerEth: eth, deploy: deploy2 })
    await c.getInstance().send(accounts[0], {value: new BN(1122), from: accounts[0]})
    await c2.getInstance().send(accounts[0], {value: new BN(3344), from: accounts[0]})
    const lastValue = (await c.getInstance().lastValue())['0']
    assert.equal( lastValue, 1122 )
    const lastValue2 = (await c2.getInstance().lastValue())['0']
    assert.equal( lastValue2, 3344 )
  })

  it( 'retrieves back forked deploys', async () => {
    const ddeploy = await bm.getMergedDeploy('DifferentSender-deploy', deploy.get('deployTime') )
    const ddeploy2 = await bm.getMergedDeploy('DifferentSender-deploy', deploy2.get('deployTime') )
    assert.equal( ddeploy.get('deployTime'), deploy.get('deployTime') )
    assert.equal( ddeploy2.get('deployTime'), deploy2.get('deployTime') )
  })

  after( async () => {
//    await bm.cleanDeploy( 'DifferentSender-deploy' )
//    await bm.cleanLink(   'DifferentSender-link'   )
  })

})
