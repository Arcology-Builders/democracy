var fs = require('fs');
var Web3 = require('web3');
var web3 = new Web3();

var contractName = "ZcashEscrow"
console.log("Contract name: " + contractName);

//var endpoint = "http://localhost:12345";
//var endpoint = "http://52.4.63.14:8545";
var endpoint = "http://testnet.local-box.org:8545";

var address = "0x8cf1a92eb3c945995c89602929e63bcdcba0a096"
web3.setProvider(new web3.providers.HttpProvider(endpoint));

var code = fs.readFileSync(`contracts/${contractName}.bin`).toString();
var abi = JSON.parse(fs.readFileSync(`contracts/${contractName}.abi`).toString());

var instance = web3.eth.contract(abi).at(address);

console.log("Owner: " + instance.owner());
console.log("Beneficiary: " + instance.beneficiary());
console.log("Deadline: " + instance.deadlineEpoch());
console.log("FundingGoal: " + instance.fundingGoal());
console.log("AmountRaised: " + instance.amountRaised());
console.log("Closed: " + instance.closed());

var remoteTime = instance.checkDeadline.sendTransaction({from: web3.eth.coinbase, value: 1000000}, function(err, data) { console.log("Finished! " + err + data) });

console.log("Remote Time: " + remoteTime);
