const demo = require('..')

const chai = require('chai').use(require('chai-as-promised'));
const assert = require('assert')
const should = chai.should(); 

const    eth = demo.getNetwork('test')

describe('Deploying contract using library.', () => {

  before(async () => {
    await demo.compile('contracts', 'TestLibrary.sol')
    await demo.compile('contracts', 'TestUseLibrary.sol')
  })

  it("should find a previously deployed contract.", (done) => {
    main = async () => {
      const networkId = await eth.net_version()
      return demo.link('TestLibrary','test','account0','linkLib').then((output) => {
        return demo.deploy('TestLibrary', 'test', 'linkLib', 'deployLib', '')
      }).then((output) => {
        return demo.link('TestUseLibrary','test','account0','linkUse','TestLibrary=deployLib')
      }).then((output) => {
        return demo.deploy('TestUseLibrary', 'test', 'linkUse', 'deployUse', '_abc=123')
      }).then((output) => {
        return demo.do('TestUseLibrary', 'test', 'deployUse', 'def')
      }).then((output) => {
        return demo.cleanLink(eth, 'TestLibrary-linkLib')
      }).then((output) => {
        return demo.cleanLink(eth, 'TestUseLibrary-linkUse')
      }).then((output) => {
        return demo.cleanDeploy(eth, 'TestUseLibrary-deployUse')
      }).then((output) => {
        return demo.cleanDeploy(eth, 'TestLibrary-deployLib')
      })
    }
    main().then(() => { done() })
  })

  after( async() => {
    await demo.cleanCompile('TestLibrary')
    await demo.cleanCompile('TestUseLibrary')
  })


})
