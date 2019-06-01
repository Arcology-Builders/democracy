'use strict'
// Compile with solcjs
const fs         = require('fs')
const path       = require('path')
const solc       = require('solc')
const assert     = require('chai').assert
const { keccak } = require('ethereumjs-util')
const { List, Map, Set }
                 = require('immutable')
const { ContractsManager, awaitOutputter, getInputsToBuild }
                 = require('demo-contract')

const { traverseDirs, ensureDir, COMPILES_DIR, DEMO_SRC_PATH, fromJS, toJS,
        getImmutableKey, setImmutableKey, textsEqual, immEqual, Logger }
                 = require('demo-utils')

const LOGGER = new Logger('Compiler')

const compiles = {}

const ZEPPELIN_SRC_PATH_WS  = '../../node_modules/openzeppelin-solidity/contracts'
const ZEPPELIN_SRC_PATH_PKG = './node_modules/openzeppelin-solidity/contracts'

compiles.ZEPPELIN_SRC_PATH = fs.existsSync(ZEPPELIN_SRC_PATH_WS) ?
  ZEPPELIN_SRC_PATH_WS : ZEPPELIN_SRC_PATH_PKG

const { Flattener } = require('./flattener')

/**
 * A reusable Compiler for Democracy.js with a search path and custom outputter.
 * @class Compiler
 * @memberof module:compile
 * @param sourcePathList {Array} of strings for local directories. Can omit the `./` for relative paths.
 * @param bm {Object} optional, a BuildsManager if you've already created one with the
 *        inputters and outputters you need, possibly shared with a Linker and Deployer.
 * @param flatten {Boolean} whether to save a flattened source file into `/sourcesFlattened/${sourceFileName}`
 * @param outputFull {Boolean} where to save fill compile outputs into `/compileOutputs/$(sourceFileName}`
 */
compiles.Compiler = class {
  
  constructor({sourcePathList, bm, flatten, outputFull}) {
    // Add default paths and remove empty directories
    this.sourcePathSet = new Set(sourcePathList)
      .add(DEMO_SRC_PATH).add(compiles.ZEPPELIN_SRC_PATH).filter((d) => d)
    this.sourcePathSet.map((d) => { ensureDir(d) })
    this.cm = bm || new ContractsManager(...arguments)
    this.flatten = flatten || false
    this.outputFull = outputFull || false
  }

  /**
   * Return the internal contracts manager, for cleaning and getting contracts
   * with the same start source path, inputter, and outputter.
   */
  getContractsManager() {
    return this.cm
  }

  /**
   * Format the output from `solc` compiler into an Immutable {Map}
   * Stage 5 from
   * https://github.com/invisible-college/democracy/master/packages/compile/README.md
   * @param solcOutputContract an Immutable {Map} of contracts output from solc
   * @param requestedInputs an Immutable {Map} of contract names to source content
   * @param existingOutputs an Immutable {Map} of contract names to compiled output
   * @return an Immutable {Map} of contract names to compiled output
   */
  getCompileOutputFromSolc(solcOutputContracts, requestedInputs, existingOutputs) {
    // Filter compiled outputs to those in the requested set, and add contractName
    const requestedOutputs = solcOutputContracts.flatMap((j) => j).filter(
      (contract, contractName) => {
        return requestedInputs.has(contractName)
      })
    const tuples = requestedOutputs.map(async (contract, contractName) => {
           
      const now = new Date() 
      const inputHash = requestedInputs.get(contractName).get('inputHash') 
      const bytecode = contract.get('evm').get('bytecode').get('object') 
      assert(bytecode)
      const preHash = Map({
        type       : 'compile',
        name       : contractName,
        code       : bytecode,
        abi        : contract.get('abi'),
        inputHash  : inputHash,
        timestamp  : now.getTime(),
        dateTime   : now.toUTCString(),
      })
      const output = preHash.set('contentHash', keccak(JSON.stringify(preHash)).toString('hex'))
      // In some other place, the abiString is useful as a web output
      //const abiString = `abi${contract.name} = ${JSON.stringify(output['abi'], null, 2)}`
      if (existingOutputs.has(contractName) &&
          existingOutputs.get(contractName).get('inputHash') === inputHash) {
        LOGGER.debug(`${contract.name} is up-to-date with hash ${inputHash}, not overwriting.`)
        return [contractName, existingOutputs.get(contractName)]
      } else {
        return [contractName, await this.cm.setContract(contractName, output)]
      }
    })
    
    return Promise.all(List(tuples.values()).toJS()).then((pairs) => { return Map(pairs) })
  }
  
  /**
   * Reformat a sourceMap for solc where keys are Solidity filenames
   * and values are the Solidity source files themselves.
   * @param inputsToBuild an Immutable {Map} with members `filename` for the
   *        original Solidity filename and `source` is the original Solidity source text.
   *        the key does not matter.
   * @return a {Object} suitable for solc mapping filenames to a nested object of
   *         `content` to source file.
   */
  getSourceMapForSolc(inputsToBuild) {
    return new Map(List(inputsToBuild.values()).map((val) => {
      const fn = val.get('filename')
      assert(val.get('source'), `${fn} contains null source`)
      return [ val.get('filename'), { content: val.get('source') } ]
    })) 
  } 
 
 /**
  * Traverse solidity source files from disk and build requested inputs, and a
  * solidity findImports callback function.
  * @param { source } the filename of the requested source file input to compile, could be empty for compile all files found
  * @param { flattener } object to collect sources for flattening
  * @return { findImports } a callback for solc to resolve import statements
  * @return { requestedInputs } an Immutable {Map} of filenames as keys and source file contents as values
  */ 
  getRequestedInputsFromDisk(source, flattener) {
    const allInputFiles = []
    const inputs = {}
    
    // Filter out empty paths
    const queue = this.sourcePathSet.toJS()

    traverseDirs(
      queue,
      (fnParts) => { return ((fnParts.length > 1) && !fnParts[1].startsWith('sol')) },
      function(source, f) {
        allInputFiles.push(path.basename(f))
        let paths = f.split(path.sep)
        const keys = []
        // This is a hack to push all suffixes of a contract path
        // since it's not clear which one solcjs will request
        // in findImport below
        do {
          keys.push(paths.join(path.sep))
          if (paths.length <= 1) { break }
          paths = paths.slice(-(paths.length - 1))
        } while(true)
        const sourceObj = {source: source, inputHash: keccak(source).toString('hex')}
        keys.forEach((key) => {
          if (inputs[key]) { LOGGER.warn(`Replacing import ${key} with ${f}`) }
          inputs[key] = sourceObj
        })
      }
    )
    
    if (!allInputFiles || allInputFiles.length == 0) {
      LOGGER.warn("No source files found.")
    }

    function findImports (path) {
      assert(inputs[path], `Import not found: ${path}`)
      LOGGER.debug(`import ${inputs[path].source}`)
      flattener.addSource(path, inputs[path].source)
      return { contents: inputs[path].source }
    }

    // Filter out . and ..
    const inputFiles = (source && source.length > 2) ?
      List([path.basename(source)]) : List(allInputFiles)
    
    // Reformat keys to strip filename extensions, but keep the original filename as member
    const requestedInputs = new Map(inputFiles.map((name) => {
      const value = new Map(inputs[name]).set('filename', name) 
      assert(name.split('.')[1].startsWith('sol'))
      assert(inputs[name], `${name} not found in paths ${this.sourcePathSet.toJS()}`)
      flattener.addSource(name, inputs[name].source)
      return [ name.split('.')[0], value ]
    }))

    return {
      requestedInputs  : requestedInputs, 
      findImports      : findImports,
    }
  } 

  /**
   * Flatten sources and update it in the contracts manager outputter if the hash
   * is different (content has changed.)
   *
   * @method updateFlatten
   * @memberof module:compile
   * @param flattener a Flattener object that has been collecting sources during compilation.
   * @param sourceFile the top-level source filename with extension
   */
  async updateFlatten(flattener, sourceFile) {
    if (!this.flatten) { return }
    const oldOutput = await this.cm.inputter(`sourcesFlattened/${sourceFile}`, new Map({}))
    const oldHash = oldOutput.get('inputHash')
    const flattenedSource = flattener.flatten()
    const newHash = keccak(flattenedSource).toString('hex')
    if (oldHash !== newHash) {
      LOGGER.info(`Flattened source out-of-date, re-flattening.`)
      LOGGER.debug(`old hash ${oldHash} vs. new hash ${newHash}`)
      await this.cm.outputter(`sourcesFlattened/${sourceFile}`,
                              new Map({ 'flattenedSource' : flattenedSource,
                                        'inputHash'       : newHash }),
                                        true)
    } else {
      const diffLine = textsEqual(oldOutput.get('flattenedSource'), flattenedSource) 
      assert( diffLine === -1, `Flattened sources differ at line ${diffLine}` )
    }
  }

  async updateCompileOutput(compileOutput, sourceFile) {
    if (!this.outputFull) { return }
    const oldOutput = await this.cm.inputter(`compileOutputs/${sourceFile}`, new Map({}))
    const oldHash = oldOutput.get('inputHash')
    const newHash = keccak(JSON.stringify(compileOutput)).toString('hex')
    LOGGER.debug(`old hash ${oldHash} vs. new hash ${newHash}`)
    if (oldHash !== newHash) {
      LOGGER.info(`Compile output out-of-date, re-writing.`)
      await this.cm.outputter(`compileOutputs/${sourceFile}`,
                              new Map({ ...compileOutput,
                                        'inputHash' : newHash }),
                                        true)
    } else {
      // TODO Debug this later
      //const same = immEqual(oldOutput, fromJS( compileOutput )) 
      //assert(same, `Compile output does not match, but inputHash was same` )
    }
  }

  /**
   * Main compile method. Takes a Solidity source file name and produces compile artifacts
   * in the associated contracts manager (either remote or in a local store)
   *
   * @method compile
   * @memberof module:compile
   * @param source {string} name of source file to compile, including Solidity extension
   * @param contracts {Map} from a ContractsManager
   * @return compile output as an Immutable {Map}
   */
  async compile(source) {
    // Open contracts installed by npm -E zeppelin-solidity
    // Open contracts from democracy
   
    const flattener = new Flattener() 
    const { requestedInputs, findImports }
      = this.getRequestedInputsFromDisk(source, flattener)

    const { contractOutputs: existingOutputs } = await this.cm.getContracts()
    const inputsToBuild = getInputsToBuild(requestedInputs, existingOutputs)

    const sourcesToBuild = this.getSourceMapForSolc(inputsToBuild)

    if (sourcesToBuild.count() === 0) {
      // Hooray, nothing to build. Return existing outputs as if we had built it.
      return existingOutputs.filter((val, key) => { return requestedInputs.has(key) })
    }

    const inputs = {
      language: 'Solidity',
      settings: {
        outputSelection: {
          '*': {
            '*': [ '*' ]
          }
        }
      },
      sources: toJS( sourcesToBuild ),
    }

    const outputs = JSON.parse(solc.compile(JSON.stringify(inputs), findImports))
    if (outputs.errors) {
      LOGGER.error('ERRORS', JSON.stringify(outputs.errors))
      throw new Error(outputs.errors)
    }
    assert.ok(outputs.contracts, `Expected compile output for requested sources`)
    
    await this.updateFlatten(flattener, source)
    await this.updateCompileOutput(outputs, source)

    fs.writeFileSync("outputContracts.json", JSON.stringify(outputs.contracts, null, 2))
    assert( Map.isMap(requestedInputs) )
    return this.getCompileOutputFromSolc(fromJS( outputs.contracts ),
                                         requestedInputs, existingOutputs)
  }

}

module.exports = compiles
