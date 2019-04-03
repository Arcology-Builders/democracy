const fs     = require('fs')
const path   = require('path')
const chai   = require('chai')
const assert = chai.assert
const util   = require('ethereumjs-util')

const { Compiler, isCompile, isContract }
             = require('..')
const { Logger, ZEPPELIN_SRC_PATH }
             = require('@democracy.js/utils')
const LOGGER = new Logger('Compiler Test')

describe('Democracy compiling.', () => {
  
  let compileOutput
  let _requestedInputs
  let _inputsToBuild
  let _existingOutputs
  let _findImports
  const comp = new Compiler('node_modules/@democracy.js/test-contracts/contracts')
  const comp2 = new Compiler('contracts')

  before(async () => {
    comp.cleanAllCompilesSync()
  })

  it("gets the correct requested inputs", (done) => {
    const { requestedInputs, findImports } =
      comp.getRequestedInputsFromDisk( 'ERC20.sol' , [ZEPPELIN_SRC_PATH] )
    assert.equal(1, requestedInputs.count())
    assert.equal('ERC20.sol', requestedInputs.get('ERC20').get('filename'))
    const safeMath = fs.readFileSync(
      'node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol').toString()
    assert.equal(findImports('SafeMath.sol').contents, safeMath)
    _requestedInputs = requestedInputs
    _findImports = findImports
    done()
  })

  it('gets the correct inputs to build', (done) => {
    const { contractOutputs: existingOutputs } = comp.getContracts()
    const inputsToBuild = comp.getInputsToBuild(_requestedInputs, existingOutputs)
    assert.equal(1, inputsToBuild.count())
    assert.equal(true, inputsToBuild.get('ERC20').get('isNew'))
    assert.equal(false, inputsToBuild.get('ERC20').get('isUpdated'))
    assert.equal('ERC20.sol', inputsToBuild.get('ERC20').get('filename'))
    _inputsToBuild = inputsToBuild
    _existingOutputs = existingOutputs
    done()
  })

  it('formats the correct sourceMap for solc', (done) => {
    const sourcesToBuild = comp.getSourceMapForSolc(_inputsToBuild)
    assert.ok(sourcesToBuild.has('ERC20.sol'), 'ERC20.sol is a filename to be built')
    const erc20 = fs.readFileSync(
      'node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol').toString()
    assert.equal(erc20, sourcesToBuild.get('ERC20.sol'))
    const solc = require('solc')
    const outputs = solc.compile({sources: sourcesToBuild.toJS()}, 0, _findImports)
    assert.ok(outputs.contracts['ERC20.sol:ERC20'])
    
    // Re-enable if you ever need to dump a fresh spec
    //fs.writeFileSync('specs/solc-output.txt', JSON.stringify(outputs, null, '  '))
    const outputMap =
      comp.getCompileOutputFromSolc(outputs.contracts, _requestedInputs, _existingOutputs)
    assert.ok(outputMap.get('ERC20'))
    done()
  })

  it("should find a previously compiled contract.", async () => {
    compileOutput = await comp.compile( 'TestLibrary.sol' )
    LOGGER.debug('compileOutput', compileOutput)
    assert.ok(isCompile(compileOutput))
    const contract = comp.getContract( 'TestLibrary' )
    assert.ok(isContract(contract), "TestLibrary should have a compile output.")
  })

  it("should recompile a changed contract.", async() => {
    if (!fs.existsSync('contracts')) { fs.mkdirSync('contracts') }
    const source = 'contract TestRecompile { uint256 public thing; constructor() { thing = 0x1; } }'
    fs.writeFileSync(path.join('contracts', 'TestRecompile.sol'), source)
    const inputHash = util.keccak(source).toString('hex')
    const compileOutput = comp2.compile('TestRecompile.sol')
    assert(isCompile(compileOutput))
    const contract = comp2.getContract('TestRecompile')
    assert(isContract(contract))
    const timestamp = contract.get('timestamp')
    assert.equal(inputHash, compileOutput.get('TestRecompile').get('inputHash'))
    assert.equal(inputHash, contract.get('inputHash'))
    assert.equal(compileOutput.get('TestRecompile').get('timestamp'), timestamp)

    // Recompiling an unchanged file does not update the timestamp
    const compileOutput2 = comp2.compile('TestRecompile.sol')
    assert(isCompile(compileOutput2))
    assert.equal(inputHash, compileOutput2.get('TestRecompile').get('inputHash'))
    assert.equal(timestamp, compileOutput2.get('TestRecompile').get('timestamp'))

    const source2 = 'contract TestRecompile { uint256 public thing2; constructor() { thing2 = 0x1; } }'
    fs.unlinkSync(path.join('contracts', 'TestRecompile.sol'))
    fs.writeFileSync(path.join('contracts', 'TestRecompile.sol'), source2)
    const inputHash2 = util.keccak(source)
    const compileOutput3 = comp2.compile('TestRecompile.sol')
    assert(isCompile(compileOutput3))
    const contract2 = comp2.getContract('TestRecompile')
    assert(isContract(contract2))
    const timestamp2 = contract2.get('timestamp')
    assert.notEqual(inputHash2, inputHash)
    LOGGER.debug( 'Timestamps', timestamp, timestamp2 )
    assert.ok(Number(timestamp2) > Number(timestamp))

    fs.unlinkSync(path.join('contracts', 'TestRecompile.sol'))
    // Ideally we would rmdir this, but node requires some rimraf magic
    //fs.unlinkSync('contracts')
  })

  it("should *not* find a non-existent compiled contract.", (done) => {
    assert.notOk(comp.getContract('TestLooberry'),
                 "TestLooberry is not even a real thing, dude.")
    done()
  })
  
  it('should compile from OpenZeppelin paths', async () => {
    comp.cleanContractSync( 'ERC20' )
    const compile = await comp.compile('', 'ERC20.sol')
    assert.ok(isCompile(compile))
    comp.cleanCompileSync(compile)
    assert.notOk(comp.getContract('ERC20'))
  })

  after( async() => {
    comp.cleanAllCompilesSync(compileOutput)
  })

})
