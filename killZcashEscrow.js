var fs = require('fs');
var Web3 = require('web3');
var web3 = new Web3();

//var endpoint = "http://localhost:12345";
var endpoint = "http://52.4.63.14:8545";

web3.setProvider(new web3.providers.HttpProvider(endpoint));

var code = fs.readFileSync("contracts/ZcashEscrow.bin").toString();
var abi = JSON.parse(fs.readFileSync("contracts/ZcashEscrow.abi").toString());

var instance = web3.eth.contract(abi).at("0x7c6fccbf57b9fbcc10be81bfca05503392dca250");

var result = instance.kill({from: web3.eth.coinbase, gas: 70000});
console.log("Result: " + result);

