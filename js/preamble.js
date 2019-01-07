// Script to connect to JSONRPC and enter a REPL
var Web3 = require('web3');
var web3 = new Web3();

config = require('config')

Preamble = (network, command) => {
    coinbase = config['coinbase']
    console.log("Coinbase: " + coinbase)

    console.log("Net: " + network)
    endpoint = config['endpoints'][network]

    web3.setProvider(new web3.providers.HttpProvider(endpoint))
    return { "web3": web3 }
}

module.exports = Preamble
