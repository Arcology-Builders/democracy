const { Deployer, Linker, isLink, isDeploy } = require('..')
const { getNetwork, Logger } = require('demo-utils')
const { Map } = require('immutable')
const LOGGER = new Logger('deployer.spec')

const chai = require('chai').use(require('chai-as-promised'));
const assert = chai.assert

let networkId

describe('Democracy deploying.', () => {

  let d
  let bm

  before(async () => {
      const eth = getNetwork()
      const accounts = await eth.accounts()
      networkId = await eth.net_version()
      d = new Deployer({eth: eth, chainId: networkId, address: accounts[0] })
      bm = d.getBuildsManager()
      l = new Linker({bm: bm, chainId: networkId})
      await bm.cleanDeploy( 'TestLibrary-deployLib' )
      await bm.cleanLink( 'TestLibrary-linkLib' )
  })

  it( 'should find a previously linked contract' , async () => {
    const output = await l.link( 'TestLibrary','linkLib' )
    assert(isLink(output))
    assert(isLink(await bm.getLink( 'TestLibrary-linkLib' )), 'TestLibrary-linkLib not found')
    await bm.cleanLink( 'TestLibrary-linkLib' )
    assert.notOk(isLink(bm.getLink( 'TestLibrary-linkLib' )),
           'TestLibrary-linkLib should not be found after cleaning')
    }
  )

  it( 'should *not* find a previously linked contract' , async () => {
    assert.notOk(isLink(bm.getLink( 'TestLibrary-linkBlah' )),
      'TestLibrary-linkBlah not found')
  })

  it( 'should find a previously deployed contract' , async () => {
    const link = await l.link('TestLibrary','linkLib')
    const deploy = await d.deploy('TestLibrary', 'linkLib', 'deployLib')
    assert(isLink(await bm.getLink( 'TestLibrary-linkLib' )),
      "TestLibrary-linkLib not found")
    LOGGER.info('CHAIN ID', bm.getChainID())
    assert(isDeploy(await bm.getDeploy( 'TestLibrary-deployLib' )),
        "TestLibrary-deployLib not found")
  })

  it( 'should deploy again with no error', async () => {
    const deploy = await d.deploy('TestLibrary', 'linkLib', 'deployLib')
    await bm.cleanLink( 'TestLibrary-linkLib' )
    // Wait to clean deploy until the next test has run
  })

  it( 'links a previous deploy', async () => {
    const link = await l.link('TestUseLibrary','link', new Map({'TestLibrary': 'deployLib'}))
    await bm.cleanLink( 'TestUseLibrary-link' )
    // Now clean it
    await bm.cleanDeploy( 'TestLibrary-deployLib' )
  })

  after( async () => {
    await bm.cleanDeploy( 'TestLibrary-deployLib' )
    await bm.cleanLink( 'TestLibrary-linkLib' )
  })

})
