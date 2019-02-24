const demo = require('..')

const chai = require('chai').use(require('chai-as-promised'));
const assert = chai.assert
const should = chai.should(); 

describe('Democracy compiling.', () => {
  
  let eth
  let networkId

  before(async () => {
    eth = demo.getNetwork('test')
    networkId = await eth.net_version()
    demo.cleanCompileSync('TestLibrary')
    await demo.compile('contracts', 'TestLibrary.sol')
  })

  it("should find a previously compiled contract.", async () => {
    const compile = demo.getContract('TestLibrary')
    assert.ok(compile, "TestLibrary should have a compile output.")
  })

  it("should *not* find a non-existent compiled contract.", (done) => {
    assert.notOk(demo.getContract('TestLooberry'), "TestLooberry is not even a real thing, dude.")
    done()
  })

  after( async() => {
    demo.cleanCompileSync('TestLibrary')
  })

})
