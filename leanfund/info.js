contract = new require('../js/contract')('LeanFund')

var instance = contract.instance

console.log("Instance: " + JSON.stringify(instance));
console.log("Owner: " + instance.owner());
console.log("Beneficiary: " + instance.beneficiary());
console.log("Deadline: " + instance.deadlineBlockNumber());
console.log("FundingGoal: " + instance.fundingGoal());
console.log("AmountRaised: " + instance.amountRaised());
console.log("payoutETH: " + instance.payoutETH());
console.log("Fee: " + instance.fee());
console.log("FeeWithdrawn: " + instance.feeWithdrawn());
console.log("Open: " + instance.open());
console.log("Remote Time: " + instance.getNow());
