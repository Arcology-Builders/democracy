var fs = require('fs');
var Web3 = require('web3');
var web3 = new Web3();

//var endpoint = "http://localhost:12345";
var endpoint = "http://52.4.63.14:8545";

web3.setProvider(new web3.providers.HttpProvider(endpoint));

var code = fs.readFileSync("contracts/SearchAgainstHumanity.bin").toString();
var abi = JSON.parse(fs.readFileSync("contracts/SearchAgainstHumanity.abi").toString());

web3.eth.contract(abi).new({data: code, from: web3.eth.coinbase, gas: 1000000}, function(err, contract) {
  if (err) {
    console.error(err);
    return;
  } else if (contract.address) {
    console.log('address: ' + contract.address);
  }
});
