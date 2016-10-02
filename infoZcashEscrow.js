var fs = require('fs');
var Web3 = require('web3');
var web3 = new Web3();

var contractName = "ZcashEscrow"
console.log("Contract name: " + contractName);

//var endpoint = "http://localhost:12345";
//var endpoint = "http://52.4.63.14:8545";
var endpoint = "http://testnet.local-box.org:8545";

//v1 Address
//var address = "0x8cf1a92eb3c945995c89602929e63bcdcba0a096"
// v2 Address
// var address = "0x7c6fccbf57b9fbcc10be81bfca05503392dca250"
// v3 Address
//var address = "0xfe4a8853a3aa7c00e2cbfc1b95c1100213be20c9"
// v4 Address
var address = "0x5e522be9c91ee6411426ec05650d97efbbcd8139";

web3.setProvider(new web3.providers.HttpProvider(endpoint));

var code = fs.readFileSync(`contracts/${contractName}.bin`).toString();
var abi = JSON.parse(fs.readFileSync(`contracts/${contractName}.abi`).toString());

var instance = web3.eth.contract(abi).at(address);

console.log("Instance: " + JSON.stringify(instance));
console.log("Owner: " + instance.owner());
console.log("Arbiter: " + instance.arbiter());
console.log("Beneficiaries: " + instance.beneficiaries());
console.log("Deadline: " + instance.deadlineEpoch());
console.log("FundingGoal: " + instance.fundingGoal());
console.log("AmountRaised: " + instance.amountRaised());
console.log("SplitAmount: " + instance.splitAmount());
console.log("Open: " + instance.open());
console.log("Closed: " + instance.closed());
console.log("Approved: " + instance.approved());

var remoteTime = instance.checkDeadline.sendTransaction({from: web3.eth.coinbase, value: 1000000}, function(err, data) { console.log("Finished! " + err + data) });

console.log("Remote Time: " + remoteTime);
