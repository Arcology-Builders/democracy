const demo = require('..')
const chai = require('chai')
const assert = chai.assert
const expect = chai.expect
const should = chai.should()
chai.use(require('chai-as-promised'))

const { Map, List } = require('immutable')

let networkId

describe('Democracy linking', () => {

  before(async (done) => {
    demo.cleanCompileSync("TestLibrary")
    eth = demo.getNetwork('test')
    networkId = await eth.net_version()
    done()
  })

  // Expect error thrown from promise
  // https://stackoverflow.com/a/45496509
  it('throws an error to link without compiling', async () => {
    await expect(demo.link('TestLibrary', 'test', 'account0', 'linkLib'))
                 .to.be.rejectedWith(Error)
  })
  
  it('does not produce a link file if it fails', () => {
    assert.notOk(demo.getLink(networkId, 'TestLibrary'))
  })

  it('compiles first then links', (done) => {
    demo.compile('contracts', 'TestLibrary.sol')
    demo.link('TestLibrary', 'test', 'account0', 'linkLib').then((output) => {
      assert(Map.isMap(output), "Linking should produce a map")
      const output2 = demo.getLink(networkId, "TestLibrary-linkLib")
      assert(List.isList(output.get('abi')))
      assert(List.isList(output2.get('abi')))
      assert(output2.equals(output), 'Link output should equal the map read from link file.')
      done()
    }).catch((error) => {
      assert.fail(error)
      done()
    })
  })

  after((done) => {
    demo.cleanCompileSync("TestLibrary")
    demo.cleanLinkSync(networkId, "TestLibrary-linkLib")
    done()
  })

})
