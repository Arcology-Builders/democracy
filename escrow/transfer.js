escrow = require('./base')

escrow((instance, web3) => {
    web3.eth.sendTransaction(
        {
            from: web3.eth.accounts[0],
            to: web3.eth.accounts[1],
            value: web3.toWei(1, "ether")
        }, function(err, data) {
            console.error(err)
            console.log(data)
        }
    ) 
})
