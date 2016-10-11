var fs = require('fs');
var express = require('express');

var app = express();

var solc = require('solc');
var Web3 = require('web3');
var web3 = new Web3();
/*
web3.setProvider(new web3.providers.HttpProvider("http://ml.toom.im:8556"));

fs.readFile("hello.solc", function(err, data) {
  if (err) {
    console.error(err);
    return;
  }
  var source = data.toString(); // because it's a buffer
  console.log(source);
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


function getBalanceString() {
  var coinbase = web3.eth.coinbase;
  var originalBalance = web3.eth.getBalance(coinbase).toNumber();
  return "Coinbase " + coinbase + " with balance " + originalBalance;
}
*/
app.get("/", function(req, res) {
  res.type("text/html");
  res.send("Express " + getBalanceString());
});

var portNumber = 6000;

app.listen(portNumber, function() {
  console.log("Listening on port " + portNumber);
});

