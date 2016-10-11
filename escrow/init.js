contract = new require('../contract')('ZcashEscrow')

func = (instance) => {
  instance.initialize(1, [contract.web3.eth.coinbase],
          new Date(Date.now() + 600).getTime() / 1000,
    {from: contract.web3.eth.coinbase, gas: 250000},
    function(err, data, something) {
        console.log("err: " + err);
        console.log("data: " + data);
        console.log("something: " + something);
    });
}
contract.runFunc(func)
