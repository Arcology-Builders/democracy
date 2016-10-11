contract = new require('../contract')('CrowdHacker')

console.log("Victim: " + contract.instance.victim());

func = (instance) => {
  instance.seedThePot(
   {
       from: contract.web3.eth.coinbase,
       to: contract.address,
       value: web3.toWei(0.1, "ether")
   }, function(err, data) { console.err(error); console.log(data); })
}
contract.runFunc(func)
