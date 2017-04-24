var fs = require('fs');
var Web3 = require('web3');
var web3 = new Web3();

config = require('config')

coinbase = config['coinbase']
console.log("Coinbase: " + coinbase)

if (process.argv.length < 2) {
    console.error("Usage: node upload.js ContractName [mainnet]");
}

contractName = process.argv[2]
console.log("Contract name: " + contractName);

mainnet = process.argv[3]
console.log("Net: " + mainnet)

if (mainnet === 'mainnet') {
  console.log("Mainnet")
  endpoint = config['endpoints']['mainnet']
} else {
  console.log("testnet")
  endpoint = config['endpoints']['testnet']
}

web3.setProvider(new web3.providers.HttpProvider(endpoint));

code = '0x' + fs.readFileSync(`contracts/${contractName}.bin`).toString()
abi = JSON.parse(fs.readFileSync(`contracts/${contractName}.abi`).toString())

//console.log("ABI: " + JSON.stringify(abi))
//console.log("Code: " + code)

web3.eth.contract(abi).new({data: code, from: coinbase, gas: "0x1249F0", gasPrice: "0x1312D00"}, function(err, contract) {
  if (err) {
    console.error("Error " + err);
    return;
  } else if (contract.address) {
    console.log('address: ' + contract.address);
  }
});
