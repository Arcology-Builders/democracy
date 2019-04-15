const { getInstance, Logger } = require('@democracy.js/utils')
const { List, Map } = require('immutable')
const assert = require('chai').assert
const abi = require('ethjs-abi')

const LOGGER = new Logger('contract')

let Contract = class {
  constructor(_eth, _deploy) {
    this.deploy = _deploy
    this.eth = _eth
    this.instance = getInstance(_eth, _deploy)
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

  getTxReceipt(_promise) {
    return new Promise((resolve, reject) => {
      _promise.then((txHash) => {
        console.log(`Result ${JSON.stringify(txHash)}`)
        resolve(this.eth.getTransactionReceipt(txHash))
			}).catch((...error) => {
				console.error(`Error ${error}`)
        reject(error)
			})
    })
  }

}

module.exports = {
  Contract: Contract,
}
