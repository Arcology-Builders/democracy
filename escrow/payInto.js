var fs = require('fs');
var Web3 = require('web3');
web3 = new Web3()

config = require('config')

address = config.get('contract_address')
endpoint = config.get('http_provider')

var contractName = "ZcashEscrow"
console.log("Contract name: " + contractName);

web3.setProvider(new web3.providers.HttpProvider(endpoint));

var code = fs.readFileSync(`contracts/${contractName}.bin`).toString();
var abi = JSON.parse(fs.readFileSync(`contracts/${contractName}.abi`).toString());

var instance = web3.eth.contract(abi).at(address);

console.log("Owner: " + instance.owner());

web3.eth.sendTransaction({from: web3.eth.coinbase, to: address, value: web3.toWei(1, "ether")});
