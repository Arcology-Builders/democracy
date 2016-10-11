contract = new require('../contract')('CrowdHacker')

crowdfundAddress = contract.config['ZcashEscrow']['contractAddress']

func = (instance) => {
  instance.initiateHack(instance.address,
    {from: contract.web3.eth.coinbase, gas: 100000},
    function(err, data, something) {
        console.log("err: " + err);
        console.log("data: " + data);
        console.log("something: " + something);
    })
}

contract.runFunc(func)
