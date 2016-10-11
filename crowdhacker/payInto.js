contract = new require('../contract')('CrowdHacker')

console.log("Victim: " + contract.instance.victim());

func = (instance) => {
  instance.seedThePot(
   {
       from: contract.web3.eth.coinbase,
       to: contract.address,
       value: web3.toWei(0.1, "ether"),
       gas: 90000
   }, function(err, data) { console.error(err); console.log(data); })
}
contract.runFunc(func)
