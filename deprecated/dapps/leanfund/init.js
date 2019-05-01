contract = new require('../js/contract')('LeanFund')

owner = process.argv[2] || web3.eth.coinbase
beneficiary = "0x3AE265c400C294e8DBA6F98fEF81b4Fd5fC3D0A5"
fundingGoalInEther = 100
deadlineBlockNumber = 4714667

console.log("Owner: " + owner)
console.log("Beneficiary: " + beneficiary)

func = (instance) => {
  instance.initialize(contract.web3.toWei(fundingGoalInEther, "ether"), [beneficiary],
          deadlineBlockNumber,
    {from: owner, gas: 2500000, gasPrice: "20000000000"},
    function(err, data, something) {
        console.log("err: " + err);
        console.log("data: " + data);
        console.log("something: " + something);
    });
}
contract.runFunc(func)
