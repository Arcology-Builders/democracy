var fs = require('fs');
var Web3 = require('web3');
var web3 = new Web3();

//var endpoint = "http://localhost:12345";
var endpoint = "http://52.4.63.14:8545";

// v3 Address
var address = "0xfe4a8853a3aa7c00e2cbfc1b95c1100213be20c9";

web3.setProvider(new web3.providers.HttpProvider(endpoint));

var code = fs.readFileSync("contracts/ZcashEscrow.bin").toString();
var abi = JSON.parse(fs.readFileSync("contracts/ZcashEscrow.abi").toString());

var instance = web3.eth.contract(abi).at(address);

var result = instance.initialize(0.01, [web3.eth.coinbase], new Date(Date.now() + 300).getTime(),
    {from: web3.eth.coinbase, gas: 50000},
    function(err, data, something) {
        console.log("err: " + err);
        console.log("data: " + data);
        console.log("something: " + something);
    });
console.log("Result: " + result);

