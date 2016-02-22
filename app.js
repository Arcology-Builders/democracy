var fs = require('fs');
var express = require('express');

var app = express();

var Web3 = require('web3');
var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider());

function getBalanceString() {
  var coinbase = web3.eth.coinbase;
  var originalBalance = web3.eth.getBalance(coinbase).toNumber();
  return "Coinbase " + coinbase + " with balance " + originalBalance;
}

app.get("/", function(req, res) {
  res.type("text/html");
  res.send("Express " + getBalanceString());
});

app.listen(5000, function() {
  console.log("Listening on port 5000");
});

