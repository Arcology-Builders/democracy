'use strict'
// Compile with solcjs
const fs         = require('fs')
const path       = require('path')
const assert     = require('chai').assert
const { List, Map, Set }
                 = require('immutable')
const { awaitInputter  } = require('./utils')

const { traverseDirs, ensureDir, COMPILES_DIR, ZEPPELIN_SRC_PATH, DEMO_SRC_PATH, fromJS,
        getImmutableKey, setImmutableKey, Logger, isNetwork }
                 = require('@democracy.js/utils')

const LOGGER = new Logger('ContractsManager')

/**
 * A ContractsManager which can read and clean compiled contracts.
 * @param _outputter {async function} a (possibly asynchronous) function that
 *        takes (key: string, val: {Map} | {List} | null ) and returns a Promise or
 *        other value that you want returned from `compile` or `clean*` methods.
 *        If missing, _outputter defaults to `setImmutableKey`
 *        to a local file-based DB store.
 */
class ContractsManager {
  
  constructor(_startSourcePath, _eth, _inputter, _outputter) {
    this.startSourcePath = _startSourcePath
    assert(isNetwork(_eth))
    this.eth = _eth
    assert((this._inputter && this._outputter) || (!this._inputter && !this.outputter))
    this.inputter = _inputter || getImmutableKey
    this.outputter = _outputter || setImmutableKey
  }

  async getContracts() {
    const contractSources = []
    if (!fs.existsSync(this.startSourcePath)) {
      LOGGER.info(`Sources directory '${this.startSourcePath}' not found.`)
      return Map({
        contractSources: List(),
        contractOutputs: Map({}),
      })
    }
    traverseDirs(
      [this.startSourcePath], // start out by finding all contracts rooted in current directory
      (fnParts) => { return (fnParts.length > 1 && !fnParts[1].startsWith('sol')) },
      function(source, f) {
        const fn = List(f.split(path.sep)).last()
        const fb = path.basename(fn.split('.')[0])
        contractSources.push(fb)
        LOGGER.info(`Source ${fb}`)
      }
    )

    return awaitInputter(
      this.inputter(COMPILES_DIR, new Map({})),
      (contractOutputs) => {
        return {
          contractSources: List(contractSources),
          contractOutputs: contractOutputs
        }
      }
    )
  }

  /**
   * Asynchronously return a contract previously outputted at key `/compiles/`
   * @param contractName name of the compiled contract
   */
  async getContract(contractName) {
    const { contractOutputs } = await this.getContracts(false)
    return contractOutputs.get(contractName)
  }

  async cleanContract(contract) {
    return this.outputter(`${COMPILES_DIR}/${contract}`, null)
  }

  async cleanAllCompiles() {
    return this.outputter(`${COMPILES_DIR}`, null)
  }

  async cleanCompile(compile) {
    return Promise.all(List(
      compile.map((compile, compileName) => {
        return this.cleanContract(compileName)
      }).values()).toJS()
    )
  }

  async getDeploys() {
    const networkId = await this.eth.net_version()
    return this.inputter(`${DEPLOYS_DIR}/${networkId}`, new Map({}))
  }

  async getLinks() {
    const networkId = await this.eth.net_version()
    return this.inputter(`${LINKS_DIR}/${networkId}`, new Map({}))
  }

  async getLink(linkName) {
    const linksMap = await getLinks()
    return linksMap.get(linkName)
  }

  async cleanLink(linkName) {
    const networkId = await this.eth.net_version()
    const fn = `${LINKS_DIR}/${networkId}/${linkName}`
    return this.outputter(`${fn}`, null)
  }

  async cleanDeploy(deployName) {
    const networkId = await this.eth.net_version()
    const fn = `${DEPLOYS_DIR}/${networkId}/${deployName}`
    return this.outputter(`${fn}`, null)
  }

}

/**
 * @return true if the given object is a compile output from a Compiler, otherwise false
 */
const isCompile = (_compile) => {
  return (_compile && Map.isMap(_compile) && _compile.count() > 0 &&
          _compile.reduce((prev, val) => {
    return prev && val.get('type') === 'compile'
  }, true))
}

/**
 * @return true if the given object is a compile output retrieved from db, otherwise false
 */
const isContract = (_contract) => {
  return (Map.isMap(_contract) && _contract.get('type') === 'compile')
}

module.exports = {
  ContractsManager : ContractsManager,
  isCompile        : isCompile,
  isContract       : isContract,
}
