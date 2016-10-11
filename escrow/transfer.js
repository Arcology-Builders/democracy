escrow = require('./base')

escrow((instance, web3) => {
    web3.eth.sendTransaction(
        {
            from: web3.eth.accounts[0],
            to: web3.eth.accounts[2],
            value: web3.toWei(0.1, "ether")
        }); 
})
