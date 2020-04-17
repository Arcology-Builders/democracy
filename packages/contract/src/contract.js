const { Logger, isNetwork, getConfig, getNetwork } = require('demo-utils')
const { List, Map } = require('immutable')
const assert = require('chai').assert
const abi = require('ethjs-abi')
const { wallet } = require('demo-keys')

const LOGGER = new Logger('contract')

const { isDeploy } = require('./utils')
const { createBM } = require('./buildsManager')

const contracts = {}

contracts.gasPrice = getConfig()['GAS_PRICE']
contracts.gasLimit = getConfig()['GAS_LIMIT']

/**
 * Initialize build manager for later calls to `getInstance` and
 * `createContract`
 *
 * @method init
 * @memberof module:contract
 *
 * @returns nothing
 */
contracts.init = async () => {
  if (!contracts.initialized) {
    LOGGER.info("Initializing contracts.")
    const eth = getNetwork()
    contracts.chainId = await eth.net_version()
    contracts.bm = await createBM({ autoConfig: true, chainId: contracts.chainId })
    contracts.initialized = true
  } else {
    LOGGER.error("Contracts already initialized.")
  }
}

contracts.getChainIdSync = () => {
  if (!contracts.initialized) { throw new Error('Initialize contracts first') }
  return contracts.chainId
}

/**
 * Generic Contract class.
 *
 * @class Contract
 * @memberof contract
 */
contracts.Contract = class {
  constructor({ deployerEth, deploy }) {
    this.deploy = deploy
    this.deployerEth = deployerEth
    this.instance = contracts.getInstance(deployerEth, deploy)
    this.address = this.deploy.get('deployAddress')
    assert(this.instance)
  }

  /**
   * Returns a String representation of this contract of the
   * form
   * `{contractName}-{deployId} at {address}`
   * @returns {String} representation in the above format.
   */
  toString() {
    return `
      ${this.deploy.get('name')}-${this.deploy.get('deployId')} at
      ${this.address}
      `
  }

  getAddress() {
    return this.deploy.get('deployedAddress')
  }

  getInstance() {
    return this.instance
  }
  
  getABIObjectByName(_name) {
		const abiMap = new Map(
			List(this.instance.abi).map((abiObj) => { return [ abiObj.name, abiObj ] })
		)
		assert(abiMap.has(_name))
		const methodObj = abiMap.get(_name)
		assert(methodObj.type === 'function')
	  return methodObj 
  }

  getMethodCallData(_name, _args) {
    const methodObj = this.getABIObjectByName(_name)
    return abi.encodeMethod(methodObj, _args)
  }

  async getTxReceipt({ method, args, options }) {
    assert(options['from'], `No from address specified.`)
    const nonce = await this.deployerEth.getTransactionCount(this.deployerEth.address)
    return new Promise((resolve, reject) => {
      method(...args, {
        from     : options['from'],
        to       : this.address,
        gas      : contracts.gasLimit,
        gasPrice : contracts.gasPrice,
        value    : options['value'],
        nonce    : nonce,
      }).then((txHash) => {
        LOGGER.debug(`Result ${JSON.stringify(txHash)}`)
        resolve(this.deployerEth.getTransactionReceipt(txHash))
			}).catch((...error) => {
				LOGGER.error(`Error ${error}`)
        reject(error)
			})
    })
  }

}

/**
 * Return an ethjs-contract instance from a previously deployed contract
 *
 * @method getInstance
 * @memberof module:contract
 *
 * @param deploy of previous
 * @return an ethjs instance that can be used to call methods on the deployed contract
 */
contracts.getInstance = (eth, deploy) => {
  assert(isNetwork(eth),
    `First parameter is not an Ethereum network.`)
  assert(isDeploy(deploy),
    `Second parameter is not a deploy output, ` +
    `instead ${JSON.stringify(deploy)}`)
  const abiJS = deploy.get('abi').toJS()
  const Contract = eth.contract(abiJS, deploy.get('code'))
  return Contract.at(deploy.get('deployAddress'))
} 

/**
 * Return a Democracy contract instance from a previous deploy,
 * including a built-in signer account. Otherwise throws an error.
 *
 * @method createContract
 * @memberof module:contract
 *
 * @param contractName {String} the base name of the contract deployed.
 * @param deployID {String} optional string for a custom deploy ID
 *   other than the default `deploy`
 */
contracts.createContract = async (contractName, deployID) => {
  if (!contracts.initialized) { throw new Error('Call contracts.initialize() first') }
  const _deployID = deployID || 'deploy'
  const deploy = await contracts.bm.getDeploy(`${contractName}-${_deployID}`)
  assert( isDeploy(deploy), `No valid deploy found for ${contractName}-${_deployID}` )
  LOGGER.info(`Auto-created Contract ${contractName} at ${deploy.get('deployAddress')}`)
  return new contracts.Contract({ deployerEth: wallet.lastSignerEth, deploy: deploy })
}

module.exports = contracts
