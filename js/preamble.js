// Script to connect to JSONRPC and enter a REPL
var Web3 = require('web3');
var web3 = new Web3();

config = require('config')

Preamble = () => {
    coinbase = config['coinbase']
    console.log("Coinbase: " + coinbase)

    if (process.argv.length < 2) {
        console.error("Usage: node -i console.js [network]");
    }

    network = process.argv[2]
    console.log("Net: " + network)
    endpoint = config['endpoints'][network]

    command = process.argv[3]

    web3.setProvider(new web3.providers.HttpProvider(endpoint))
    return { "web3": web3 }
}

module.exports = Preamble
