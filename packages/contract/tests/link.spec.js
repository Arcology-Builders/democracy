const chai     = require('chai')
chai.use(require('chai-as-promised'))
const assert   = chai.assert
const expect   = chai.expect
const should   = chai.should()

const { Map, List } = require('immutable')

const { Linker } = require('..')
const { getNetwork, Logger } 
               = require('@democracy.js/utils')
const LOGGER = new Logger('link.spec')

describe('Democracy linking', () => {

  let networkId
  let l
  let bm

  before(async () => {
    eth = getNetwork()
    networkId = await eth.net_version()
    l = new Linker({chainId: networkId})
    bm = l.getBuildsManager()
    await bm.cleanLink( 'TestLibrary-linkLib' )
  })

  // Expect error thrown from promise
  // https://stackoverflow.com/a/45496509
  it('throws an error to link a contract without a compile', async () => {
    const output = l.link( 'TestLibrary3', 'linkLib' )
    await expect( output ).to.be.rejectedWith(Error)
  })

  it('does not produce a link file if it fails', async () => {
    const link = await bm.getLink( ' TestLibrary3 ' )
    assert.notOk(link)
  })

  it( 'links a previous compile', async() => {
    const output = await l.link( 'TestLibrary', 'linkLib' )
    LOGGER.info('OUTPUT', output)
    assert(Map.isMap(output), "Linking should produce a map")
    const output2 = await bm.getLink( 'TestLibrary-linkLib' )
    assert(List.isList(output.get('abi')))
    assert(List.isList(output2.get('abi')))
    assert(output2.equals(output), 'Link output should equal the map read from link file.')
  })

  after(async () => {
    await l.getBuildsManager().cleanLink( 'TestLibrary-linkLib' )
  })

})
