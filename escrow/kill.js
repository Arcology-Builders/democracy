var fs = require('fs');
var Web3 = require('web3');
var web3 = new Web3();

//var endpoint = "http://localhost:12345";
var endpoint = "http://52.4.63.14:8545";

// v3 Contract Address
var address = "0xfe4a8853a3aa7c00e2cbfc1b95c1100213be20c9";

web3.setProvider(new web3.providers.HttpProvider(endpoint));

var code = fs.readFileSync("contracts/ZcashEscrow.bin").toString();
var abi = JSON.parse(fs.readFileSync("contracts/ZcashEscrow.abi").toString());

var instance = web3.eth.contract(abi).at(address);

var result = instance.kill({from: web3.eth.coinbase, gas: 70000});
console.log("Result: " + result);

