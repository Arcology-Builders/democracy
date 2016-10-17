contract = new require('../contract')('CrowdHacker')

func = (instance) => {
  instance.startTheHeist(
   {
       from: web3.eth.coinbase,
       gas: 150000
   })
}

contract.runFunc(func)
