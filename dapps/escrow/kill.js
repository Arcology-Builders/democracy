var fs = require('fs');
var Web3 = require('web3');
var web3 = new Web3();

config = require('config')

endpoint = config.get('http_provider')
address = config.get('contract_address')

web3.setProvider(new web3.providers.HttpProvider(endpoint));

var code = fs.readFileSync("contracts/ZcashEscrow.bin").toString();
var abi = JSON.parse(fs.readFileSync("contracts/ZcashEscrow.abi").toString());

var instance = web3.eth.contract(abi).at(address);

var result = instance.kill({from: web3.eth.coinbase, gas: 70000});
console.log("Result: " + result);

