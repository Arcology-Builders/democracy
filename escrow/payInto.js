escrow = require('./base')

fromAddr = process.argv[2]
console.log("From Address: " + fromAddr)

amountETH = process.argv[3]
console.log("Amount in ETH: " + amountETH)

escrow((instance, web3) => {
    instance.payIn("Ethereum Backer 1",
        {
            from: fromAddr,
            to: instance.address,
            value: web3.toWei(amountETH, "ether"),
            gas: 1816077,
        }
    )
/*  web3.eth.sendTransaction(
      {from: fromAddr, to: instance.address, value: web3.toWei(amountETH, "ether"),
          gas: 50000});
*/
})
