const { getInstance } = require('@democracy.js/utils')
const { List, Map } = require('immutable')
const assert = require('chai').assert
const util = require('ethereumjs-util')

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

  getInstance() {
    return this.instance
  }

  getTxReceipt(_promise) {
    return new Promise((resolve, reject) => {
      _promise.then((txHash) => {
        console.log(`Result ${JSON.stringify(txHash)}`)
        resolve(eth.getTransactionReceipt(txHash))
			}).catch((...error) => {
				console.error(`Error ${error}`)
        reject(error)
			})
    })
  }

}

module.exports = Contract
