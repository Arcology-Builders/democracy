var fs = require('fs');
var Web3 = require('web3');
var web3 = new Web3();

config = require('config')

if (process.argv.length < 2) {
    console.error("Usage: node upload.js ContractName [mainnet]")
    process.exit()
}

contractName = process.argv[2]
console.log("Contract name: " + contractName);

network = process.argv[3]

endpoint = ""

if (config['endpoints'][network]) {
  console.log("Net: " + network)
  endpoint = config['endpoints'][network]
} else {
  console.error("Endpoint not found for network: " + network)
  process.exit()
}

coinbase = config['coinbase'][network]
console.log("Coinbase: " + coinbase)

web3.setProvider(new web3.providers.HttpProvider(endpoint));

code = "0x" + fs.readFileSync(`outputs/${contractName}.bin`).toString()
abi = JSON.parse(fs.readFileSync(`outputs/${contractName}.abi`).toString())

//console.log("ABI: " + JSON.stringify(abi))
//console.log("Code: " + code)

web3.eth.contract(abi).new({data: code, from: coinbase, gas: "4700000", gasPrice: web3.eth.gasPrice}, function(err, contract) {
  if (err) {
    console.error("Error " + err);
    return;
  } else if (contract.address) {
    console.log('address: ' + contract.address);
  }
});
