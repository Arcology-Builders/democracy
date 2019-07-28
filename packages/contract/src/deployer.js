'use strict'
const path   = require('path')
const assert = require('chai').assert
const { Map, List, Seq }
             = require('immutable')
const ethjsABI = require('ethjs-abi')

const { DEPLOYS_DIR, getConfig, getNetwork, Logger, getImmutableKey, setImmutableKey, toJS }
             = require('demo-utils')
const LOGGER = new Logger('Deployer')
const { awaitOutputter, isLink, isForkedDeploy }
             = require('./utils')
const { BuildsManager }
             = require('./buildsManager')
const { isValidAddress, keccak }
             = require('ethereumjs-util')
const { getKeys } = require('ethjs-util')
const tx = require('demo-tx')

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
    this.eth       = eth || getNetwork()
    this.chainId   = chainId
    assert(isValidAddress(address), `${address} not a valid ethereum address`)
    this.address   = address 
  }

  getBuildsManager() {
    return this.bm
  }

  getNewContractTx(args, options, abi, contractBytecode) {
/*
		if (typeof newMethodArgs[newMethodArgs.length - 1] === 'function') newMethodCallback = newMethodArgs.pop();
		if (hasTransactionObject(newMethodArgs)) providedTxObject = newMethodArgs.pop();
   */
		const constructorMethod = abi.filter((x) => x.type === 'constructor')[0]
		const assembleTxObject = {}

		// set contract deploy bytecode
		if (contractBytecode) {
			assembleTxObject.data = contractBytecode;
		}   
    LOGGER.debug('args', args)

		// append encoded constructor arguments
		if (constructorMethod) {
      LOGGER.debug('constructorMethod.inputs', constructorMethod.inputs)
      const keys = getKeys(constructorMethod.inputs, 'type')
      LOGGER.debug('keys', keys)
			const constructorBytecode = ethjsABI.encodeParams(keys, args).substring(2); // eslint-disable-line
			assembleTxObject.data = `${assembleTxObject.data}${constructorBytecode}`;
		}   

		return assembleTxObject.data
  }

  /**
   * Validate dependencies then deploy the given contract output to a network.
   * @param eth network object connected to a local provider
   * @param contractName {String} of source contract
   * @param linkId {String} ID of previous link to instantiate and deploy
   * @param deployId {String} ID of previous deploy
   * @param ctorArgs {Object} Immutable Map of constructor arguments, can be empty Map or null
   * @param fork {boolean} whether to fork the given deploy at the current timestamp
   *   can be left null for false
   */
  async deploy(contractName, linkId, deployId, ctorArgs, fork) {
    const linkName   = `${contractName}-${linkId}`
    const link       = await this.bm.getLink(linkName)
    assert( isLink(link), `Link ${linkName} not valid: ${JSON.stringify(link.toJS())}` )
    const code       = link.get('code')
    const abi        = link.get('abi')
    const _deployId  = deployId || 'deploy'
    const deployName = `${contractName}-${_deployId}`
   
    assert.equal(this.chainId, await this.eth.net_version())

    const now = new Date()
    const deployMap = await this.bm.getDeploys()

    const inputHash = keccak(JSON.stringify(link.toJS())).toString('hex')
    // Warn with multiple deploys with the same ID
    const deploy = deployMap.get(deployName)
    if (Map.isMap(deploy)) {
      LOGGER.debug(`previous input hash ${deploy.get('inputHash')}`)
      LOGGER.debug(`current input hash ${inputHash}`)
      if (deploy.get('inputHash') === inputHash) {
        if (fork) {
          LOGGER.info(`Forking at time ${now.getTime()}`)
        } else {
          LOGGER.info(`${deployName} has already been deployed`,
                      `on chain ID ${this.chainId} at address ${deploy.get('deployAddress')}`)
          return deploy
        }
      }
    }
    LOGGER.info(`Deploy ${deployName} is out-of-date, re-deploying...`)

    const ctorArgList = Map.isMap(ctorArgs) ? List(ctorArgs.values()).toJS() : []
    LOGGER.debug(ctorArgList)

    const Contract = this.eth.contract(toJS( abi ), code)

    const gasPrice = getConfig()[ 'GAS_PRICE' ]
    const gasLimit = getConfig()[ 'GAS_LIMIT' ]
    LOGGER.debug(`gasPrice`, gasPrice)
    LOGGER.debug(`gasLimit`, gasLimit)

    const txData = this.getNewContractTx(ctorArgList, 
        { from: this.address, gas: gasLimit, gasPrice: gasPrice },
                                        toJS( abi ), code)
    LOGGER.debug('newContractTxData', txData)

    const rawTx = await tx.createRawTx({
      from: this.address,
      data: txData,
    })
    const deployPromise = tx.sendSignedTx({
      rawTx: rawTx, signerEth: this.eth
    }).then((txHash) => this.eth.getTransactionReceipt(txHash))

    /*
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
*/
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
      inputHash    : inputHash,
    })

    const forkOutput = new Map({
      type         : 'forkedDeploy',
      deployTx     : new Map(minedContract),
      deployAddress: minedContract.contractAddress,
      deployDate   : now.toLocaleString(),
      deployTime   : now.getTime(),
    })

    // This is an updated deploy, overwrite it
    await this.bm.setDeploy(deployName, deployOutput, true)
    // We should never overwrite a fork, otherwise what was the point
    await this.bm.setForkedDeploy(deployName, forkOutput, false)
    const forkedDeploy = await this.bm.getForkedDeploy(deployName, now.getTime())
    assert( isForkedDeploy(forkedDeploy), `Not a valid forked deploy ${forkedDeploy.toJS()}`)
    return this.bm.getMergedDeploy(deployName, now.getTime())
  }

}

module.exports = deploys
