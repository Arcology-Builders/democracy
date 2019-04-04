'use strict'
const { Compiler } = require('..')
const { Logger, RemoteDB }
             = require('@democracy.js/utils')
const LOGGER = new Logger('remote.spec.js')

const { compileNewFile, checkNoRecompile, checkRecompile }
  = require('./recompile')

describe('Democracy recompiling remotely on source change', () => {
  
  let _inputHash
  let _timestamp
  const r = new RemoteDB( 'ganache.arcology.nyc', 7000 )
  const postCompile = (subKey, val) => {
    r.postHTTP('/api/compiles/' + subKey, val)
  }
  const c  = new Compiler( 'contracts', r.postHTTP.bind(r) )

  before(async () => {
    await c.cleanAllCompiles()
  })

  it( 'compiles a new contract with no previous hash', async() => {
    const outputs = compileNewFile(c)
    LOGGER.debug('outputs', outputs)
    _inputHash = outputs.inputHash
    _timestamp = outputs.timestamp
  })

  it( 'does not recompile a source file with unchanged contents/hash', async() => {
    checkNoRecompile(c, _inputHash, _timestamp)
  })

  it( 'recompiles a source file with changed contents/hash ', async() => {
    checkRecompile(c, _inputHash, _timestamp)
  })

})
