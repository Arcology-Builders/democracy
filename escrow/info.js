var fs = require('fs');
var Web3 = require('web3');
var web3 = new Web3();
config = require('config')

var contractName = "ZcashEscrow"
console.log("Contract name: " + contractName);

endpoint = config.get('http_provider')
address = config.get('contract_address')

web3.setProvider(new web3.providers.HttpProvider(endpoint));

var code = fs.readFileSync(`contracts/${contractName}.bin`).toString();
var abi = JSON.parse(fs.readFileSync(`contracts/${contractName}.abi`).toString());

var instance = web3.eth.contract(abi).at(address);

console.log("Instance: " + JSON.stringify(instance));
console.log("Owner: " + instance.owner());
console.log("Beneficiary: " + instance.beneficiary());
console.log("Backer History: " + instance.backer_history());
console.log("Deadline: " + instance.deadlineEpoch());
console.log("FundingGoal: " + instance.fundingGoal());
console.log("AmountRaised: " + instance.amountRaised());
console.log("AmountRaisedETH: " + instance.amountRaisedETH());
console.log("AmountRaisedBTC: " + instance.amountRaisedBTC());
console.log("Fee: " + instance.fee());
console.log("Open: " + instance.open());
console.log("Remote Time: " + instance.getNow());
