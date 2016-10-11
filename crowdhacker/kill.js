contract = new require('../contract')('CrowdHacker')

console.log("Victim: " + contract.instance.victim());

func = (instance) => {
  instance.kill(
   {
       from: contract.web3.eth.coinbase,
       gas: 50000
   }, function(err, data) { console.error(err); console.log(data); })
}
contract.runFunc(func)
