fromAddr = process.argv[2]
network = process.argv[3] || "rinkeby"

contract = new require('../js/contract')('ZcashEscrow', network)

deadlineHuman = new Date(Date.now() + 2400000)
console.log("Human Deadline: " + deadlineHuman)

deadlineEpoch = Math.round(deadlineHuman.getTime() / 1000)
console.log("Epoch Deadline: " + deadlineEpoch)

func = (instance) => {
  instance.initialize(
    contract.web3.toWei(1, "ether"),
    [contract.web3.eth.coinbase],
    deadlineEpoch,       
    {from: fromAddr, gas: 250000},
    function(err, data, something) {
        console.log("err: " + err);
        console.log("data: " + data);
        console.log("something: " + something);
    });
}
contract.runFunc(func)
