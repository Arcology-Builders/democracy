const demo = require('..')
const { print } = require('@democracy.js/utils')

const chai = require('chai').use(require('chai-as-promised'));
const assert = chai.assert
const should = chai.should(); 
const Eth = require('ethjs')

//process.env["NODE_CONFIG_DIR"] = "./../config"
const config = require('config')
let networkId

describe('Democracy deploying.', () => {

  before(async () => {
      const eth = demo.getNetwork('test')
      networkId = await eth.net_version()
      demo.cleanDeploySync(networkId, 'TestLibrary-deployLib')
      print("clean deploy")
      demo.cleanLinkSync(networkId, 'TestLibrary-linkLib')
      demo.cleanContractSync('TestLibrary')
      await demo.compile('contracts', 'TestLibrary.sol')
  })

  it("should find a previously linked contract.", (done) => {
    main = async () => {
      let  eth = demo.getNetwork('test')
      const networkId = await eth.net_version()
      return demo.link('TestLibrary','test','account0','linkLib').then((output) => {
        assert(demo.getLink(networkId, "TestLibrary-linkLib"),
          "TestLibrary-linkLib not found")
        return demo.cleanLinkSync(networkId, 'TestLibrary-linkLib')
      }).then((output) => {
        assert(!demo.getLink(networkId, "TestLibrary-linkLib"),
          "TestLibrary-linkLib should not be found after cleaning")
      })

    }
    main().then(() => { done() })
  })

  it("should *not* find a previously linked contract.", (done) => {
    main = async() => {
      assert(!demo.getLink(networkId, "TestLibrary-linkBlah"),
        "TestLibrary-linkBlah not found")
    }
    main().then(() => { done() })
  })

  it("should find a previously deployed contract.", (done) => {
    main = async () => {
      return demo.link('TestLibrary','test','account0','linkLib').then((output) => {
        return demo.deploy('TestLibrary', 'test', 'linkLib', 'deployLib', '')
      }).then((output) => {
        assert(demo.getLink(networkId, "TestLibrary-linkLib"),
          "TestLibrary-linkLib not found")
        assert(demo.getDeploy(networkId, "TestLibrary-deployLib"),
          "TestLibrary-deployLib not found")
        return demo.cleanLinkSync(networkId, 'TestLibrary-linkLib')
      }).then((output) => {
        return demo.cleanDeploySync(networkId, 'TestLibrary-deployLib')
      })
    }
    main().then(() => { done() })
  })

  after( async() => {
    demo.cleanDeploySync(networkId, 'TestLibrary-deployLib')
    demo.cleanLinkSync(networkId, 'TestLibrary-linkLib')
    demo.cleanContractSync('TestLibrary')
  })


})
