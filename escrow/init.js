fs = require('fs')
Web3 = require('web3')
web3 = new Web3()
config = require('config')

endpoint = config.get("http_provider")
address = config.get("contract_address")

web3.setProvider(new web3.providers.HttpProvider(endpoint));

var code = fs.readFileSync("contracts/ZcashEscrow.bin").toString();
var abi = JSON.parse(fs.readFileSync("contracts/ZcashEscrow.abi").toString());

var instance = web3.eth.contract(abi).at(address);

var result = instance.initialize(1, [web3.eth.coinbase], new Date(Date.now() + 300).getTime() / 1000, web3.eth.coinbase,
    {from: web3.eth.coinbase, gas: 250000},
    function(err, data, something) {
        console.log("err: " + err);
        console.log("data: " + data);
        console.log("something: " + something);
    });
console.log("Result: " + result);

