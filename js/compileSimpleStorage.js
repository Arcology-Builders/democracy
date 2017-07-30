//var solc = require('solc');
var fs = require('fs');
var Web3 = require('web3');
var web3 = new Web3();

//var endpoint = "http://localhost:12345";
var endpoint = "http://52.4.63.14:8545";

web3.setProvider(new web3.providers.HttpProvider(endpoint));

fs.readFile("SimpleStorage.solc", function(err, data) {
  if (err) {
    console.error(err);
    return;
  }
  console.log(data);
  var source = data.toString(); // because it's a buffer
  var compiled = web3.eth.compile.solidity(source);
  var code = compiled.SimpleStorage.code;
  var abi = compiled.SimpleStorage.info.abiDefinition;
  
  web3.eth.contract(abi).new({data: code, from: web3.eth.coinbase}, function(err, contract) {
    if (err) {
      console.error("Error: " + err);
      return;
    } else if (contract.address) {
      console.log('address: ' + contract.address);
      console.log('value: ' + contract.get());
      contract.set(22);
      console.log('value: ' + contract.get()); 
    }
  });
});
