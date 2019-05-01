escrow = require('./base')

escrow((instance, web3) => {
    console.log(JSON.stringify(web3.eth.accounts))
    web3.eth.accounts.forEach((account) => console.log(web3.eth.getBalance(account)))
})
