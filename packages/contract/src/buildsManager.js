'use strict'
// Compile with solcjs
const fs         = require('fs')
const path       = require('path')
const assert     = require('chai').assert
const { List, Map, Set }
                 = require('immutable')
const { ContractsManager } = require('./contractsManager')
const { BuildsManager } = require('./buildsManager')

const { Logger, LINKS_DIR, DEPLOYS_DIR, getNetwork, awaitInputter, awaitOutputter }
                 = require('demo-utils')

const LOGGER = new Logger('BuildsManager')

const bm = {}

/**
 * A BuildsManager is a ContractsManager which in addition to managing contracts and compiles, also
 * handles network-specific builds like links and deploys.
 * @param _outputter {Function} a (possibly asynchronous) function that
 *        takes (key: string, val: {Map} | {List} | null ) and returns a Promise or
 *        other value that you want returned from `compile` or `clean*` methods.
 *        If missing, _outputter defaults to `setImmutableKey`
 *        to a local file-based DB store.
 */
bm.BuildsManager = class extends ContractsManager {
  
  constructor({sourcePathList, inputter, outputter, chainId}) {
    super(...arguments)
    if (!chainId) { throw new Error("no chain ID passed in") }
    this.chainId = chainId
  }

  getChainID() {
    return this.chainId
  }

  async getDeploys() {
    if (!this.deploysMap) {
      this.deploysMap = await this.inputter(`${DEPLOYS_DIR}/${this.chainId}`, new Map({}))
    }
    return this.deploysMap
  }
  
  async getDeploy(deployName) {
    const deploysMap = await this.getDeploys()
    return this.deploysMap.get(deployName)
  } 

  async setDeploy(deployName, deployOutput, overwrite) {
    const deployFilePath = `${DEPLOYS_DIR}/${this.chainId}/${deployName}`
    LOGGER.debug(`Writing deploy to ${deployFilePath}`)
    this.deploysMap = this.deploysMap.set(deployName, deployOutput)
    return awaitOutputter(this.outputter(deployFilePath, deployOutput, overwrite),
                          () => { return deployOutput })
  }

  async getLinks() {
    if (!(this.linksMap)) {
      this.linksMap = await this.inputter(`${LINKS_DIR}`, new Map({}))
    }
    return this.linksMap
  }

  async getLink(linkName) {
    const linksMap = await this.getLinks()
    return linksMap.get(linkName)
  }
  
  async setLink(linkName, linkOutput, overwrite) {
    const linkFilePath = `${LINKS_DIR}/${linkName}`

    LOGGER.debug(`Writing link to ${linkFilePath}`)
    this.linksMap = this.linksMap.set(linkName, linkOutput)
    return awaitOutputter(this.outputter(linkFilePath, linkOutput, overwrite),
                          () => { return linkOutput })
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

bm.createBM = async ({ sourcePathList, chainId, hostname, port, autoConfig }) => {
  const { createInOut } = require('demo-client')
  const { inputter, outputter } = createInOut({hostname, port, autoConfig}) 
  const _chainId = (autoConfig) ? (await getNetwork().net_version()) : chainId
  return new bm.BuildsManager({
    sourcePathList : sourcePathList,
    chainId        : _chainId,
    inputter       : inputter,
    outputter      : outputter,
  })
}

module.exports = bm
