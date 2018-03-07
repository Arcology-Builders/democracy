contract = new require('../js/contract')('TimelyResource', 'local')

owner = process.argv[2] || web3.eth.coinbase

console.log("Owner: " + owner)

func = (instance) => {
  return instance.owner();
}
contract.runFunc(func)
