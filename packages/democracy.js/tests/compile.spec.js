const demo = require('..')

const chai = require('chai').use(require('chai-as-promised'));
const assert = chai.assert
const { isCompile, isContract } = require('@democracy.js/utils')

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
    const contract = demo.getContract('TestLibrary')
    assert.ok(isContract(contract), "TestLibrary should have a compile output.")
  })

  it("should *not* find a non-existent compiled contract.", (done) => {
    assert.notOk(demo.getContract('TestLooberry'), "TestLooberry is not even a real thing, dude.")
    done()
  })
  
  it('should compile from OpenZeppelin paths', (done) => {
    const compile = demo.compile('', 'ERC20.sol')
    assert.ok(isCompile(compile))
    done()
  })

  after( async() => {
    demo.cleanCompileSync('TestLibrary')
  })

})
