escrow = require('./base')

backerAddress = process.argv[2]
console.log("Withdraw From Address: " + backerAddress)

escrow((instance, web3) => {
    console.log("Withdraw From Address: " + backerAddress)
    instance.safeWithdrawal(
        {
            from: backerAddress,
            gas: 180000
        })
})
