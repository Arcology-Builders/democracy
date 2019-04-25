'use strict'
const { Logger } = require('demo-utils')

const { Compiler } = require('..')
const { ContractsManager } = require('demo-contract')
const LOGGER = new Logger('recompile.spec.js')

const { compileNewFile, checkNoRecompile, checkRecompile }
  = require('./recompile')

describe('Democracy recompiling on source change', () => {
  
  let _inputHash
  let _timestamp
  const c  = new Compiler( 'contracts' )
  const cm = new ContractsManager( 'contracts' )

  before(async () => {
    await cm.cleanAllCompiles()
  })

  it( '(re) compiles only for changed sources / hash ', async() => {
    
    // compiles a new contract with no previous hash
    const outputs = await compileNewFile(c).catch((e) => { throw e })
    LOGGER.debug('outputs', outputs)
    _inputHash = outputs.inputHash
    _timestamp = outputs.timestamp

    // does not recompile a source file with unchanged contents/hash
    checkNoRecompile(c, _inputHash, _timestamp).catch((e) => { throw e })

    // recompiles a source file with changed contents/hash 
    checkRecompile(c, _inputHash, _timestamp).catch((e) => { throw e })

  })

})
