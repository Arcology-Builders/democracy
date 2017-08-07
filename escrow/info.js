contract = new require('../js/contract')('ZcashEscrow','rinkeby')

var instance = contract.instance

console.log("Instance: " + JSON.stringify(instance));
console.log("Owner: " + instance.owner());
console.log("Beneficiary: " + instance.beneficiary());
//console.log("Backer History: " + instance.backer_history());
console.log("Deadline: " + instance.deadlineEpoch());
console.log("FundingGoal: " + instance.fundingGoal());
console.log("AmountRaised: " + instance.amountRaised());
console.log("AmountRaisedETH: " + instance.amountRaisedETH());
console.log("AmountRaisedBTC: " + instance.amountRaisedBTC());
console.log("payoutETH: " + instance.payoutETH());
console.log("Fee: " + instance.fee());
console.log("FeeWithdrawn: " + instance.feeWithdrawn());
console.log("Open: " + instance.open());
console.log("Remote Time: " + instance.getNow());
