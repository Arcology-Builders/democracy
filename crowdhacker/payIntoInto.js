contract = new require('../contract')('CrowdHacker')

console.log("Victim: " + contract.instance.victim());

func = (instance) => {
  instance.payIntoVictim(
   {
       from: contract.web3.eth.coinbase,
       gas: 4500000
   }, function(err, data) { console.error(err); console.log(data); })
}
contract.runFunc(func)
