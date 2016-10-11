fs = require('fs');
Web3 = require('web3');
web3 = new Web3()

config = require('config')

crowdfundAddr = config.get('contract_address')
hackerAddr = config.get('hacker_address')
endpoint = config.get('http_provider')

contractName = "CrowdHacker"
console.log("Contract name: " + contractName);

web3.setProvider(new web3.providers.HttpProvider(endpoint));

code = fs.readFileSync(`contracts/${contractName}.bin`).toString()
abi = JSON.parse(fs.readFileSync(`contracts/${contractName}.abi`).toString())

instance = web3.eth.contract(abi).at(hackerAddr)

console.log("Victim: " + instance.victim());

instance.seedThePot(
   {
       from: web3.eth.coinbase,
       to: hackerAddr,
       value: web3.toWei(0.1, "ether")
   });
