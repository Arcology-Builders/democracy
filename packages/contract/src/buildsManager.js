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
 * A BuildsManager is a ContractsManager which in addition to managing contracts and compiles,
 * also handles network-specific builds like links and deploys.
 * @class BuildsManager
 * @memberof module:contract
 * @param _outputter {Function} a (possibly asynchronous) function that
 *        takes (key: string, val: {Map} | {List} | null ) and returns a Promise or
 *        other value that you want returned from `compile` or `clean*` methods.
 *        If missing, _outputter defaults to `setImmutableKey`
 *        to a local file-based DB store.
 */
bm.BuildsManager = class extends ContractsManager {
  
  constructor({sourcePathList, inputter, outputter, chainId, allowForking}) {
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
 
  /**
   * Asynchronous method to get parent-level deploy information (not specific to a fork)
   * @method getDeploy
   * @memberof class:BuildsManager
   * @param deployName {String} the full deploy name including contract and deploy ID
   *   Example: `ContractName-deploy`
   */
  async getDeploy(deployName, forkTime) {
    const deploysMap = await this.getDeploys()
    const parentDeploy = this.deploysMap.get(deployName).get('deploy')
    return parentDeploy
  } 

  async getLatestForkedDeploy(deployName) {
    const deploysMap = await this.getDeploys()
    const parentDeploy = deploysMap.get(deployName)
    const latestForkTime = List(parentDeploy.get('forks').keys()).sort().last()
    return this.getForkedDeploy(deployName, latestForkTime)
  }
  
  async getEarliestForkedDeploy(deployName) {
    const deploysMap = await this.getDeploys()
    const parentDeploy = deploysMap.get(deployName)
    const earliestForkTime = List(parentDeploy.get('forks').keys()).sort().first()
    LOGGER.debug('Earliest fork', earliestForkTime)
    return this.getForkedDeploy(deployName, earliestForkTime)
  }

  /**
   * Get merged deploy data (both parent-level and fork-level) in one Immutable Map.
   * @param deployName {String} a deploy name in the form of ContractName-deploy
   * @param forkTime {String}
   *
   * @method getForkedDeploy
   * @memberof class:BuildsManager
   */
  async getForkedDeploy(deployName, forkTime) {
    const deploysMap = await this.getDeploys()
    const parentDeploy = deploysMap.get(deployName)
    const forkedDeploy = parentDeploy.get('forks').get(String(forkTime))
    return forkedDeploy
  }

  /**
   * Return both fork-level and parent-level deploy data as one Immutable Map.
   *
   * @param deployName {String}
   * @param forkTime {String}
   */
  async getMergedDeploy(deployName, forkTime) {
    const deploysMap = await this.getDeploys()
    const fd = await ((forkTime) ? this.getForkedDeploy(deployName, forkTime) :
      this.getEarliestForkedDeploy(deployName))
    return fd.merge(deploysMap.get(deployName).get('deploy'))
  }

  /**
   * Write fork-level deploy data (deployTime, deployAddress, deployerAddress)
   * Should be preceded by a call to `setDeploy` to write parent-level deploy data.
   * @method setForkedDeploy
   * @memberof class:BuildsManager
   *
   * @param deployName {String}
   * @param forkOutput {Immutable Map}
   * @param overwrite
   */
  async setForkedDeploy(deployName, forkOutput, overwrite) {
    const forkTime = String(forkOutput.get('deployTime'))
    const deployKeyPath = `${DEPLOYS_DIR}/${this.chainId}/${deployName}/forks/${forkTime}`
    LOGGER.debug(`Writing forked deploy to ${deployKeyPath}`)
    const parentDeploy = this.deploysMap.get(deployName, Map({}))
    const forks = parentDeploy.get('forks', Map({})).set(forkTime, forkOutput)
    this.deploysMap = this.deploysMap.set(deployName, parentDeploy.set('forks', forks))
    return awaitOutputter(this.outputter(deployKeyPath, forkOutput, overwrite),
                          () => { return forkOutput })
  }

  /**
   * Write parent deploy-data (ABI, constructor args) to the (possibly remote) keystore.
   * Should be accompanied with a `setForkedData` call for fork-level data.
   * @method setDeploy
   * @memberof module:deployer
   *
   * @param deployName {String} name of the deploy in the form of ContractName-deployID.
   * @param deployOutput {Immutable Map} key-value deploy data.
   * @param overwrite {Boolean} whether to overwrite any existing deploys with this name.
   */
  async setDeploy(deployName, deployOutput, overwrite) {
    const deployKeyPath = `${DEPLOYS_DIR}/${this.chainId}/${deployName}/deploy`
    LOGGER.debug(`Writing parent deploy to ${deployKeyPath}`)
    const parentDeploy = this.deploysMap.get(deployName, Map({})).set('deploy', deployOutput)
    this.deploysMap = this.deploysMap.set(deployName, parentDeploy)
    
    return awaitOutputter(this.outputter(deployKeyPath, deployOutput, overwrite),
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
