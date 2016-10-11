fs = require('fs')
Web3 = require('web3')
web3 = new Web3()

config = require('config')

ZcashEscrow = (instanceFunc) => {

  endpoint = config.get('http_provider')
  address = config.get('contract_address')

  web3.setProvider(new web3.providers.HttpProvider(endpoint))

  code = fs.readFileSync("contracts/ZcashEscrow.bin").toString()
  abi = JSON.parse(fs.readFileSync("contracts/ZcashEscrow.abi").toString())

  instance = web3.eth.contract(abi).at(address);

  result = instanceFunc(instance, web3)
  console.log("Result: " + result);
}

module.exports = ZcashEscrow
