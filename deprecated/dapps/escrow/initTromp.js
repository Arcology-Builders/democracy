fs = require('fs')
Web3 = require('web3')
web3 = new Web3()
config = require('config')

const endpoint = config.get("http_provider")
const address = config.get("contract_address")

web3.setProvider(new web3.providers.HttpProvider(endpoint))

const code = fs.readFileSync("contracts/ZcashEscrow.bin").toString()
const abi = JSON.parse(fs.readFileSync("contracts/ZcashEscrow.abi").toString())

const instance = web3.eth.contract(abi).at(address)

const deadline = new Date("14 Oct 2016 16:00 UTC")
const deadlineEpoch = deadline.getTime() / 1000
console.log("Deadline: " + deadline + " = " + deadlineEpoch)

// Exchange Rate as of 10 Oct 2016 9:20am EDT
const btc_eth_rate = 0.01878
const amountBTC = 20
const amountETH = amountBTC / btc_eth_rate

console.log("Amount: 20 BTC = " + amountETH)

const result = instance.initialize(amountETH, [web3.eth.coinbase], deadlineEpoch, web3.eth.coinbase,
    {from: web3.eth.coinbase, gas: 250000},
    function(err, data, something) {
        console.log("err: " + err);
        console.log("data: " + data);
        console.log("something: " + something);
    });
console.log("Result: " + result);

