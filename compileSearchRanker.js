//var solc = require('solc');
var fs = require('fs');
var Web3 = require('Web3');
var web3 = new Web3();

//var endpoint = "http://localhost:12345";
var endpoint = "http://52.4.63.14:8545";

web3.setProvider(new web3.providers.HttpProvider(endpoint));

fs.readFile("SearchRanker.solc", function(err, data) {
  if (err) {
    console.error(err);
    return;
  }
  console.log(data);
  var source = data.toString(); // because it's a buffer
  var compiled = web3.eth.compile.solidity(source);
  var code = compiled.test.code;
  var abi = compiled.test.info.abiDefinition;
  
  web3.eth.contract(abi).new({data: code}, function(err, contract) {
    if (err) {
      console.error(err);
      return;
    } else if (contract.address) {
      console.log('address: ' + contract.address);
    }
  });
});
