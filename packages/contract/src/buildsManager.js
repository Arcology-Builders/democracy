'use strict'
// Compile with solcjs
const fs         = require('fs')
const path       = require('path')
const assert     = require('chai').assert
const { List, Map, Set }
                 = require('immutable')
const { awaitInputter  } = require('./utils')
const { ContractsManager } = require('./contractsManager')
const { BuildsManager } = require('./buildsManager')

const { Logger, LINKS_DIR, DEPLOYS_DIR, getNetwork }
                 = require('demo-utils')

const LOGGER = new Logger('BuildsManager')

const bm = {}

/**
 * A BuildsManager is a ContractsManager which in addition to managing contracts and compiles, also
 * handles network-specific builds like links and deploys.
 * @param _outputter {async function} a (possibly asynchronous) function that
 *        takes (key: string, val: {Map} | {List} | null ) and returns a Promise or
 *        other value that you want returned from `compile` or `clean*` methods.
 *        If missing, _outputter defaults to `setImmutableKey`
 *        to a local file-based DB store.
 */
bm.BuildsManager = class extends ContractsManager {
  
  constructor({startSourcePath, inputter, outputter, chainId}) {
    super(...arguments)
    if (!chainId) { throw new Error("no chain ID passed in") }
    this.chainId = chainId
  }

  getChainID() {
    return this.chainId
  }

  async getDeploys() {
    return this.inputter(`${DEPLOYS_DIR}/${this.chainId}`, new Map({}))
  }
  
  async getDeploy(deployName) {
    const deploysMap = await this.getDeploys()
    return deploysMap.get(deployName)
  } 

  async getLinks() {
    return this.inputter(`${LINKS_DIR}`, new Map({}))
  }

  async getLink(linkName) {
    const linksMap = await this.getLinks()
    return linksMap.get(linkName)
  }

  async cleanLink(linkName) {
    const fn = `${LINKS_DIR}/${linkName}`
    return this.outputter(`${fn}`, null)
  }

  async cleanDeploy(deployName) {
    const fn = `${DEPLOYS_DIR}/${this.chainId}/${deployName}`
    return this.outputter(`${fn}`, null)
  }

}

bm.createBM = async ({sourcePath, chainId, hostname, port, autoConfig}) => {
  const { createInOut } = require('demo-client')
  const { inputter, outputter } = createInOut({hostname, port, autoConfig}) 
  const _chainId = (autoConfig) ? (await getNetwork().net_version()) : chainId
  return new bm.BuildsManager({
    startSourcePath: sourcePath,
    chainId        : _chainId,
    inputter       : inputter,
    outputter      : outputter,
  })
}

module.exports = bm
