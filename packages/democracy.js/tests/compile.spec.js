const demo = require('..')

const chai = require('chai').use(require('chai-as-promised'));
const assert = chai.assert
const { isCompile, isContract } = require('demo-utils')

describe('Democracy compiling.', () => {
  
  let eth
  let networkId
  let compileOutput

  before(async () => {
    eth = demo.getNetwork('test')
    networkId = await eth.net_version()
    compileOutput = await demo.compile('contracts', 'TestLibrary.sol')
  })

  it("should find a previously compiled contract.", async () => {
    const contract = demo.getContract('TestLibrary')
    assert.ok(isContract(contract), "TestLibrary should have a compile output.")
  })

  it("should *not* find a non-existent compiled contract.", (done) => {
    assert.notOk(demo.getContract('TestLooberry'), "TestLooberry is not even a real thing, dude.")
    done()
  })
  
  it('should compile from OpenZeppelin paths', async () => {
    const compile = await demo.compile('', 'ERC20.sol')
    assert.ok(isCompile(compile))
    demo.cleanCompileSync(compile)
    assert.notOk(demo.getContract('ERC20'))
  })

  after( async() => {
    demo.cleanCompileSync(compileOutput)
  })

})
