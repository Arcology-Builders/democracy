// Test harness that relies on a fresh ganache running on 8555
// and keys saved to keys/ganache.test.json

fs = require('fs')
Web3 = require('web3')
web3 = new Web3()
ganachelib = require('ganache-cli')

config = require('config')['test']

endpoint = config['endpoint']
gasLimit = config['gasLimit']
gasPrice = config['gasPrice']

// Re-enable when you figure out what's wrong with programmatic
// ganache
//KEYS_PATH="./keys/ganache.test.json"
//ganache = ganachelib.provider({account_keys_path: KEYS_PATH})
//web3.setProvider(ganache)
web3.setProvider(new web3.providers.HttpProvider(endpoint))

keys = JSON.parse(fs.readFileSync(`keys/ganache.test.json`).toString()).addresses

//keys = ganache.manager.state.accounts

coinbase = null;
for (var key in keys) {
  // get first key only for now
  coinbase = key
  console.log(`First test key found (coinbase): ${coinbase}`);
  break;
}

TestHarness = (contractName) => {

  code = fs.readFileSync(`outputs/${contractName}.bin`).toString()
  abi = JSON.parse(fs.readFileSync(`outputs/${contractName}.abi`).toString())
  that = this

  // Takes a partial function that depends on a map of options
  // and we also add a callback that accepts (err, result) Node.js style 
  this.runFunc = function(partial_func) {
    return new Promise((resolve, reject) => {
      partial_func({from: coinbase, gas: gasLimit, gasPrice: gasPrice},
        (err, result) => {
          if (err) { reject(err); }
          else { resolve(that); } // keep passing the harness object
        });
      }
    );
  }

  return new Promise((resolve, reject) => {
    web3.eth.contract(abi).new({data: code, from: coinbase, gas: gasLimit, gasPrice: gasPrice},
      (err, contract) => {
        if (err) {
          console.error("Error " + err);
          reject(err);
        } else if (contract.address) {
          console.log(`Contract deployed at ${contract.address}`)
          that.address = contract.address
          that.instance = web3.eth.contract(abi).at(this.address)
          resolve(that);
        }
      });
  });

  //this.web3 = web3
  //this.config = config
  // return this
}

module.exports = TestHarness
