network = process.argv[3] || "rinkeby"

contract = new require('../js/contract')('ZcashEscrow', network)

func = (instance) => {
    var result = instance.safeKill({from: web3.eth.coinbase, gas: 70000},
            function(err, data, something) {
                console.log("err: " + err)
                console.log("data: " + data)
                console.log("something: " + something)
            })
}

contract.runFunc(func)
