const fs     = require('fs')
const path   = require('path')
const assert = require('chai').assert
const { isCompile, isContract }
             = require('demo-contract')
const { Logger }
             = require('demo-utils')
const LOGGER = new Logger('recompile.js')
const util   = require('ethereumjs-util')

const compileNewFile = async (c) => {

  // Write a new source file from scratch
  if (!fs.existsSync('contracts')) { fs.mkdirSync('contracts') }
  const source = 'contract TestRecompile { uint256 public thing; constructor() { thing = 0x1; } }'
  fs.writeFileSync(path.join('contracts', 'TestRecompile.sol'), source)

  const inputHash = util.keccak(source).toString('hex')
  const compileOutput = await c.compile('TestRecompile.sol')
  assert(isCompile(compileOutput))

  const contract = await c.getContractsManager().getContract('TestRecompile')
  assert(isContract(contract))

  const timestamp = contract.get('timestamp')
  assert.equal(inputHash, compileOutput.get('TestRecompile').get('inputHash'))
  assert.equal(inputHash, contract.get('inputHash'))
  assert.equal(compileOutput.get('TestRecompile').get('timestamp'), timestamp)

  const output = {
    inputHash: inputHash,
    timestamp: timestamp,
  }
  LOGGER.debug('OUTPUT', output)
  return output
}

const checkNoRecompile = async (c, prevInputHash, prevTimestamp) => {

  // Recompiling an unchanged file does not update the timestamp
  const compileOutput2 = await c.compile('TestRecompile.sol')
  assert(isCompile(compileOutput2))
  const tr = compileOutput2.get('TestRecompile')
  LOGGER.debug('InputHash', tr.get('inputHash'))
  assert.equal(prevInputHash, tr.get('inputHash'))
  assert.equal(prevTimestamp, tr.get('timestamp'))

}

const checkRecompile = async (c, prevInputHash, prevTimestamp) => {

  const source2 = 'contract TestRecompile { uint256 public thing2; constructor() { thing2 = 0x1; } }'
  fs.unlinkSync(path.join('contracts', 'TestRecompile.sol'))
  fs.writeFileSync(path.join('contracts', 'TestRecompile.sol'), source2)
  const inputHash2 = util.keccak(source2)
  const compileOutput3 = await c.compile('TestRecompile.sol')
  assert(isCompile(compileOutput3))
  const contract2 = await c.getContractsManager().getContract('TestRecompile')
  assert(isContract(contract2))
  const timestamp2 = await contract2.get('timestamp')
  assert.notEqual(inputHash2, prevInputHash)
  LOGGER.debug( 'Timestamps', prevTimestamp, timestamp2 )
  assert.ok(Number(timestamp2) > Number(prevTimestamp))

  fs.unlinkSync(path.join('contracts', 'TestRecompile.sol'))
  // Ideally we would rmdir this, but node requires some rimraf magic
  //fs.unlinkSync('contracts')

}

module.exports = {
    compileNewFile  : compileNewFile,
    checkNoRecompile: checkNoRecompile,
    checkRecompile  : checkRecompile,
}
