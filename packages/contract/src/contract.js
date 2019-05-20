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

contracts.init = async () => {
  if (!contracts.initialized) {
    LOGGER.info("Initializing contracts.")
    const eth = getNetwork()
    const chainId = await eth.net_version()
    contracts.bm = await createBM({ autoConfig: true, chainId: chainId })
    contracts.initialized = true
  } else {
    LOGGER.error("Contracts already initialized.")
  }
}

contracts.Contract = class {
  constructor({ deployerEth, deploy }) {
    this.deploy = deploy
    this.deployerEth = deployerEth
    this.instance = contracts.getInstance(deployerEth, deploy)
    this.address = this.deploy.get('deployAddress')
    assert(this.instance)
  }

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
 * Return an instance from a previously deployed contract
 * @param deploy of previous
 * @return an ethjs instance that can be used to call methods on the deployed contract
 */
contracts.getInstance = (eth, deploy) => {
  assert(isNetwork(eth), 'First parameter is not an Ethereum network.')
  assert(isDeploy(deploy), 'Second parameter is not a deploy output.')
  const Contract = eth.contract(deploy.get('abi').toJS(), deploy.get('code'))
  return Contract.at(deploy.get('deployAddress'))
} 

contracts.createContract = async (contractName) => {
  if (!contracts.initialized) { throw new Error('Call contracts.initialize() first') }
  const deploy = await contracts.bm.getDeploy(`${contractName}-deploy`)
  assert( isDeploy(deploy), `No valid deploy found for ${contractName}-deploy` )
  LOGGER.info(`Auto-created Contract ${contractName} at ${deploy.get('deployAddress')}`)
  return new contracts.Contract({ deployerEth: wallet.lastSignerEth, deploy: deploy })
}

module.exports = contracts
