var fs = require('fs');
var Web3 = require('web3');
var web3 = new Web3();

if (process.argv.length < 2) {
    console.error("Usage: node upload.js ContractName");
}

var contractName = process.argv[2]
console.log("Contract name: " + contractName);

//var endpoint = "http://localhost:12345";
//var endpoint = "http://52.4.63.14:8545";
var endpoint = "http://testnet.local-box.org:8545";

web3.setProvider(new web3.providers.HttpProvider(endpoint));

var code = fs.readFileSync(`contracts/${contractName}.bin`).toString();
var abi = JSON.parse(fs.readFileSync(`contracts/${contractName}.abi`).toString());

web3.eth.contract(abi).new({data: code, from: web3.eth.coinbase, gas: 1000000}, function(err, contract) {
  if (err) {
    console.error(err);
    return;
  } else if (contract.address) {
    console.log('address: ' + contract.address);
  }
});
