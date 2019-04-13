const { Linker, Deployer, Contracts } = require('..')
const { getNetwork } 
               = require('@democracy.js/utils')
const chai     = require('chai')
const assert   = chai.assert
const expect   = chai.expect
const should   = chai.should()

const { Map, List } = require('immutable')

describe('Democracy linking', () => {

  let networkId
  let l
  let c

  before(async () => {
    eth = getNetwork()
    networkId = await eth.net_version()
    l = new Linker(eth)
    await l.getContractsManager().cleanContractSync("TestLibrary")
  })

  // Expect error thrown from promise
  // https://stackoverflow.com/a/45496509
  it('throws an error to link without compiling', async () => {
    await expect(contract.link('TestLibrary', 'test', 'account0', 'linkLib'))
                 .to.be.rejectedWith(Error)
  })
  
  it('does not produce a link file if it fails', () => {
    assert.notOk(contract.getLink(networkId, 'TestLibrary'))
  })

  it('compiles first then links', async() => {
    await c.compile( 'TestLibrary.sol' )
    l.link( 'TestLibrary', 'linkLib' ).then((output) => {
      assert(Map.isMap(output), "Linking should produce a map")
      const output2 = contract.getLink(networkId, "TestLibrary-linkLib")
      assert(List.isList(output.get('abi')))
      assert(List.isList(output2.get('abi')))
      assert(output2.equals(output), 'Link output should equal the map read from link file.')
    }).catch((error) => {
      assert.fail(error)
    })
  })

  after((done) => {
    c.getContractsManager().cleanContractSync("TestLibrary")
    l.cleanLinkSync(networkId, "TestLibrary-linkLib")
    done()
  })

})
