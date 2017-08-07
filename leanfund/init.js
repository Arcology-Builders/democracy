contract = new require('../js/contract')('LeanFund')

fromAddr = process.argv[2]

func = (instance) => {
  instance.initialize(contract.web3.toWei(2, "ether"), [contract.web3.eth.coinbase],
          649084,
    {from: fromAddr, gas: 2500000, gasPrice: "20000000000"},
    function(err, data, something) {
        console.log("err: " + err);
        console.log("data: " + data);
        console.log("something: " + something);
    });
}
contract.runFunc(func)
