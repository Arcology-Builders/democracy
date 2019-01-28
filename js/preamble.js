// Script to connect to JSONRPC and enter a REPL
const Eth = require('ethjs');

config = require('config')

Preamble = (network, command) => {
    coinbase = config['coinbase']
    console.log("Coinbase: " + coinbase)

    console.log("Net: " + network)
    endpoint = config['endpoints'][network]

    const eth = new Eth(new Eth.HttpProvider(endpoint));
    return eth
}

module.exports = Preamble
