'use strict'
const path   = require('path')
const assert = require('chai').assert
const { Map, List, Seq }
             = require('immutable')

const { DEPLOYS_DIR, getConfig, Logger, getImmutableKey, setImmutableKey }
             = require('demo-utils')
const LOGGER = new Logger('Deployer')
const { awaitOutputter, isLink } = require('./utils')
const { BuildsManager } = require('./buildsManager')
const { isValidAddress, keccak } = require('ethereumjs-util')

const deploys = {}

/**
 * Class encapsulating a deployer for a given network (chain ID)
 * and inputter / outputter (possibly a remote data store)
 * @memberof module:contract
 * @param inputter {Function} a getter function, possibly async,
 *   that takes a key and returns the associated value if it exists.
 * @param outputter {Function} a setter function, possibly async,
 *   that takes a key and a value as an Immutable Map, and returns
 *   the written value, also as an Immutable Map.
 * @param bm {Object} a BuildsManager, null if we want to auto-create one.
 * @param eth {Object} an Ethereum network object
 * @param chainId {String} the chain ID of the given eth, must match.
 * @param address {String} the `0x`-prefixed Ethereum address to deploy from
 */
deploys.Deployer = class {

  constructor({inputter, outputter, bm, eth, chainId, address}) {
    assert(chainId, `chainId param is empty.`)
    this.bm        = bm || new BuildsManager(...arguments)
    this.eth       = eth
    this.chainId   = chainId
    assert(isValidAddress(address), `${address} not a valid ethereum address`)
    this.address   = address
  }

  getBuildsManager() {
    return this.bm
  }

  /**
   * Validate dependencies then deploy the given contract output to a network.
   * @param eth network object connected to a local provider
   * @param contractName {String} of source contract
   * @param linkId {String} ID of previous link to instantiate and deploy
   * @param deployId {String} ID of previous deploy
   * @param ctorArgs {Immutable Map} of constructor arguments, can be empty Map or null
   * @param fork {boolean} whether to fork the given deploy at the current timestamp
   *   can be left null for false
   */
  async deploy(contractName, linkId, deployId, ctorArgs, fork) {
    const linkName   = `${contractName}-${linkId}`
    const link       = await this.bm.getLink(linkName)
    assert( isLink(link), `Link ${linkName} not valid: ${JSON.stringify(link.toJS())}` )
    const code       = link.get('code')
    const abi        = link.get('abi')
    const deployName = `${contractName}-${deployId}`
   
    assert.equal(this.chainId, await this.eth.net_version())

    const now = new Date()
    const deployMap = await this.bm.getDeploys()

    const inputHash = keccak(JSON.stringify(link.toJS())).toString('hex')
    // Warn with multiple deploys with the same ID
    const deploy = deployMap.get(deployName)
    if (Map.isMap(deploy) && (deploy.get('inputHash') === inputHash) && !fork) {
      LOGGER.info(`${deployName} has already been deployed`,
                  `on chain ID ${this.chainId} at address ${deploy.get('deployAddress')}`)
      LOGGER.debug(`with input hash ${inputHash}`)
      return deploy
    } else {
      LOGGER.info(`Deploy ${deployName} is out-of-date, re-deploying...`)
      if (fork) {
        LOGGER.info(`Forking at time ${now.getTime()}`)
      }
      LOGGER.debug(`current hash ${inputHash}`)
    }

    const ctorArgList = Map.isMap(ctorArgs) ? List(ctorArgs.values()).toJS() : new Map({})
    LOGGER.debug(ctorArgList)

    const Contract = this.eth.contract(abi.toJS(), code)

    const gasPrice = getConfig()[ 'GAS_PRICE' ]
    const gasLimit = getConfig()[ 'GAS_LIMIT' ]
    LOGGER.debug(`gasPrice`, gasPrice)
    LOGGER.debug(`gasLimit`, gasLimit)

    const deployPromise = new Promise((resolve, reject) => {
      Contract.new(...ctorArgList, {
        from: this.address, gas: gasLimit, gasPrice: gasPrice,
      }).then((txHash) => {
          const checkTransaction = setInterval(() => {
            this.eth.getTransactionReceipt(txHash).then((receipt) => {
              if (receipt) {
                clearInterval(checkTransaction)
                resolve(receipt) 
              }
            })
          })
        })
        .catch((error) => {
          console.error(`error ${error}`)
          reject(error)
        })
    })

    const minedContract = await deployPromise.then((receipt) => { return receipt })
    LOGGER.debug('MINED', minedContract)
    const instance = Contract.at(minedContract.contractAddress)

    const deployOutput = new Map({
      type         : 'deploy',
      name         : contractName,
      chainId      : this.chainId,
      deployId     : deployId,
      linkId       : link.get('linkId'),
      abi          : abi,
      code         : code,
      deployTx     : new Map(minedContract),
      deployAddress: minedContract.contractAddress,
      deployDate   : now.toLocaleString(),
      deployTime   : now.getTime(),
      inputHash    : inputHash,
    })

    // This is an updated deploy, overwrite it
    return this.bm.setDeploy(deployName, deployOutput, true, fork)
  }

}

module.exports = deploys
