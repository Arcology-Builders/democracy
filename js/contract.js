fs = require('fs')
Web3 = require('web3')
web3 = new Web3()

config = require('config')

Contract = (contractName, network) => {

  this.contractName = contractName
  console.log(`Contract Name: ${this.contractName}`)

  if (network === 'test') {
    ganache = require('ganache-cli')
    console.log('Endpoint: Ganache')
    web3.setProvider(ganache.provider())
  } else {
    this.endpoint = config['endpoints'][network]
    console.log(`Endpoint: ${this.endpoint}`)
    web3.setProvider(new web3.providers.HttpProvider(this.endpoint))
  }
  addresses = JSON.parse(fs.readFileSync('web/addresses.js').toString())
  this.address = config[this.contractName]['contractAddress']
  console.log(`Contract Address: ${this.address}`)
  file = JSON.parse(fs.readFileSync(`outputs/${this.contractName}.json`).toString())

  code = file.code
  // fs.readFileSync(`outputs/${this.contractName}.bin`).toString()
  abi = file.abi
  // JSON.parse(fs.readFileSync(`outputs/${this.contractName}.abi`).toString())

  this.instance = web3.eth.contract(abi).at(this.address)
  this.web3 = web3
  this.config = config

  this.runFunc = (instanceFunc) => {
    result = instanceFunc(this.instance)
    console.log('Result: ' + result)
  }

  return this
}

module.exports = Contract
