const demo = require('..')

const chai = require('chai').use(require('chai-as-promised'));
const assert = require('assert')
const should = chai.should(); 

const    eth = demo.getNetwork('test')

describe('Democracy linking.', () => {

  before(async () => {
    await demo.compile(['contracts'], 'TestLibrary.sol')
  })

  it("should find a previously linked contract.", (done) => {
    main = async () => {
      const networkId = await eth.net_version()
      return demo.link('TestLibrary','test','account0','linkLib').then((output) => {
        assert(demo.getLink(networkId, "TestLibrary-linkLib"),
          "TestLibrary-linkLib not found")
        return demo.cleanLink(eth, 'TestLibrary-linkLib')
      }).then((output) => {
        assert(!demo.getLink(networkId, "TestLibrary-linkLib"),
          "TestLibrary-linkLib should not be found after cleaning")
      })

    }
    main().then(() => { done() })
  })

  it("should *not* find a previously linked contract.", (done) => {
    main = async() => {
      const networkId = await eth.net_version()
      assert(!demo.getLink(networkId, "TestLibrary-linkBlah"),
        "TestLibrary-linkBlah not found")
    }
    main().then(() => { done() })
  })

  it("should find a previously deployed contract.", (done) => {
    main = async () => {
      const networkId = await eth.net_version()
      return demo.link('TestLibrary','test','account0','linkLib').then((output) => {
        return demo.deploy('TestLibrary', 'test', 'linkLib', 'deployLib', '')
      }).then((output) => {
        assert(demo.getLink(networkId, "TestLibrary-linkLib"),
          "TestLibrary-linkLib not found")
        assert(demo.getDeploy(networkId, "TestLibrary-deployLib"),
          "TestLibrary-deployLib not found")
        return demo.cleanLink(eth, 'TestLibrary-linkLib')
      }).then((output) => {
        return demo.cleanDeploy(eth, 'TestLibrary-deployLib')
      })
    }
    main().then(() => { done() })
  })

  after( async() => {
    await demo.cleanCompile('TestLibrary')
  })


})
