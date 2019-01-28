var fs = require('fs');
var Web3 = require('web3');
var web3 = new Web3();

config = require('config')

if (process.argv.length < 2) {
    console.error("Usage: node deploy.js [deps.json] [network]")
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

const LIB_PATTERN = /__(([a-zA-Z])+\/*)+\.sol:[a-zA-Z]+__/g
const matches = code.match(LIB_PATTERN)
if (matches) {
  console.log("Library Symbols to Replace: ")
  console.log(JSON.stringify(matches))
}
//console.log("ABI: " + JSON.stringify(abi))
//console.log("Code: " + code)

web3.eth.contract(abi).new({data: code, from: coinbase, gas: "6000000", gasPrice: "0x21105b0"}, function(err, contract) {
  if (err) {
    console.error("Error " + err);
    return;
  } else if (contract.address) {
    console.log('address: ' + contract.address);
  }
});
