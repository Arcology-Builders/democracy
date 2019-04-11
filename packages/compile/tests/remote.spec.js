'use strict'
const fs = require('fs')
const path = require('path')
const { Compiler, isCompile, isContract } = require('..')
const { Logger, RemoteDB, fromJS, toJS, COMPILES_DIR, DB_DIR, deepEqual }
             = require('@democracy.js/utils')
const RESTServer = require('@democracy.js/rest-server')
const LOGGER = new Logger('remote.spec.js')
const assert = require('chai').assert

const { compileNewFile, checkNoRecompile, checkRecompile }
  = require('./recompile')

describe('Democracy recompiling remotely on source change', () => {
  
  let _inputHash
  let _timestamp
  const server = new RESTServer(6666, true)
  const r = new RemoteDB( 'localhost', 6666 )
  const postCompile = async (subKey, val) => {
    LOGGER.info('postCompile', JSON.stringify(toJS(val)))
    const compile = await r.postHTTP('/api/' + subKey, toJS(val))
    return fromJS(compile)
  }
  const getCompile = async (subKey, defaultVal) => {
    const compiles = await r.getHTTP('/api/' + subKey, defaultVal)
    LOGGER.info('getCompile', subKey)
    LOGGER.info('getCompile', compiles)
    return fromJS(compiles)
  }
  const c  = new Compiler( 'contracts', getCompile, postCompile )

  before(async () => {
    await server.start()
    if (fs.existsSync(path.join(DB_DIR, COMPILES_DIR, 'SomeContract.json'))) {
      fs.unlinkSync(path.join(DB_DIR, COMPILES_DIR, 'SomeContract.json'))
    }
  })

  it( 'reads back a remote compile that it writes', async () => {
    const compile = await c.compile( 'SomeContract.sol' )
    LOGGER.info('compile', compile.toString())
    assert(isCompile(compile))
    const contract = await c.getContract( 'SomeContract' )
    assert(isContract(contract))
    LOGGER.info('CONTRACT', contract)
    LOGGER.info('COMPILE', compile.get('SomeContract'))
    assert.equal(JSON.stringify(compile.get('SomeContract').toJS()),
                 JSON.stringify(contract.toJS()))
  })
/*
  it( '' , async () => {
    // '*remotely* compiles a new contract with no previous hash'
    const outputs = await compileNewFile(c).catch((e) => { throw e } )
    LOGGER.debug('outputs', outputs)
    _inputHash = outputs.inputHash
    _timestamp = outputs.timestamp

    // '*remotely* does not recompile a source file with unchanged contents/hash'
    await checkNoRecompile(c, _inputHash, _timestamp).catch((e) => { throw e })

    // 'recompiles a source file with changed contents/hash '
    await checkRecompile(c, _inputHash, _timestamp).catch((e) => { throw e })
  })
*/
  after(async () => {
    server.stop()
  })

})
