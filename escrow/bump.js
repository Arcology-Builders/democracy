escrow = require('./base')

escrow((instance, web3) => {
    instance.bump(web3.toWei(0.1, "ether"), "BTC Backer #1",
        {from: web3.eth.coinbase, gas: 250000})
})
