escrow = require('./base')

address = process.argv[2]
console.log("Withdraw From Address: " + address)

escrow((instance, web3) => {
    console.log("Withdraw From Address: " + web3.eth.coinbase)
    instance.safeWithdrawal(
        {
            from: web3.eth.coinbase,
            gas: 70000
        })
})
