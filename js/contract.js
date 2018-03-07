fs = require('fs')
Web3 = require('web3')
web3 = new Web3()

config = require('config')

Contract = (contractName, network) => {

  this.contractName = contractName
  console.log(`Contract Name: ${this.contractName}`)

  this.endpoint = config['endpoints'][network]
  this.address = config[this.contractName]['contractAddress']
  console.log(`Endpoint: ${this.endpoint}`)
  console.log(`Contract Address: ${this.address}`)

  web3.setProvider(new web3.providers.HttpProvider(this.endpoint))

  code = fs.readFileSync(`outputs/${this.contractName}.bin`).toString()
  abi = JSON.parse(fs.readFileSync(`outputs/${this.contractName}.abi`).toString())

  this.instance = web3.eth.contract(abi).at(this.address);
  this.web3 = web3
  this.config = config

  this.runFunc = (instanceFunc) => {
    result = instanceFunc(this.instance)
    console.log("Result: " + result)
  }

  return this
}

module.exports = Contract
