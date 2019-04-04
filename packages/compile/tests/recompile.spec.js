'use strict'
const { Compiler } = require('..')
const { Logger }
             = require('@democracy.js/utils')
const LOGGER = new Logger('recompile.spec.js')

const { compileNewFile, checkNoRecompile, checkRecompile }
  = require('./recompile')

describe('Democracy recompiling on source change', () => {
  
  let _inputHash
  let _timestamp
  const c  = new Compiler( 'contracts' )

  before(async () => {
    await c.cleanAllCompiles()
  })

  it( '(re) compiles only for changed sources / hash ', async() => {
    
    // compiles a new contract with no previous hash
    const outputs = await compileNewFile(c)
    LOGGER.debug('outputs', outputs)
    _inputHash = outputs.inputHash
    _timestamp = outputs.timestamp

    // does not recompile a source file with unchanged contents/hash
    checkNoRecompile(c, _inputHash, _timestamp)

    // recompiles a source file with changed contents/hash 
    checkRecompile(c, _inputHash, _timestamp)

  })

})
