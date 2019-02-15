const demo = require('..')

const chai = require('chai').use(require('chai-as-promised'));
const assert = require('assert')
const should = chai.should(); 

let networkId

describe('Deploying contract using library.', () => {

  before((done) => {
    (async () => {
      const eth = demo.getNetwork('test')
      networkId = await eth.net_version()
      demo.cleanCompileSync('TestLibrary')
      demo.cleanCompileSync('TestUseLibrary')
      demo.cleanLinkSync(networkId, 'TestLibrary-linkLib')
      demo.cleanLinkSync(networkId, 'TestUseLibrary-linkUse')
      demo.cleanDeploySync(networkId, 'TestUseLibrary-deployUse')
      demo.cleanDeploySync(networkId, 'TestLibrary-deployLib')
      await demo.compile('contracts', 'TestLibrary.sol')
      await demo.compile('contracts', 'TestUseLibrary.sol')
    })().then(() => { done() })
  })

  it("should link library from previous compile", (done) => {
    demo.link('TestLibrary','test','account0','linkLib')
      .then((output) => {
        return demo.deploy('TestLibrary', 'test', 'linkLib', 'deployLib', '') })
      .then((output) => { done() })
  })

  it("should link class to previous library deploy", (done) => {
    demo.link('TestUseLibrary','test','account0','linkUse','TestLibrary=deployLib')
      .then((output) => {
        return demo.deploy('TestUseLibrary', 'test', 'linkUse', 'deployUse', '_abc=123') })
      .then((output) => { done() })
  })
/*
  it("should call pure view function on previous class deploy", (done) => {
    demo.do('TestUseLibrary', 'test', 'deployUse', 'def')
      .then((output) => { done() })
  })
*/
  after((done) => {
    demo.cleanLinkSync(networkId, 'TestLibrary-linkLib')
    demo.cleanLinkSync(networkId, 'TestUseLibrary-linkUse')
    demo.cleanDeploySync(networkId, 'TestUseLibrary-deployUse')
    demo.cleanDeploySync(networkId, 'TestLibrary-deployLib')
    demo.cleanCompileSync('TestLibrary')
    demo.cleanCompileSync('TestUseLibrary')
    done()
  })


})
