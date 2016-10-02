var fs = require('fs');
var Web3 = require('web3');
var web3 = new Web3();

var contractName = "ZcashEscrow"
console.log("Contract name: " + contractName);

//var endpoint = "http://localhost:12345";
//var endpoint = "http://52.4.63.14:8545";
var endpoint = "http://testnet.local-box.org:8545";

var address = "0x7c6fccbf57b9fbcc10be81bfca05503392dca250"
web3.setProvider(new web3.providers.HttpProvider(endpoint));

var code = fs.readFileSync(`contracts/${contractName}.bin`).toString();
var abi = JSON.parse(fs.readFileSync(`contracts/${contractName}.abi`).toString());

var instance = web3.eth.contract(abi).at(address);

console.log("Owner: " + instance.owner());

web3.eth.sendTransaction({from: web3.eth.coinbase, to: address, value: web3.toWei(0.05, "ether")});
