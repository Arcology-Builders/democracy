// Test harness that relies on a fresh ganache running on 8555
// and keys saved to keys/ganache.test.json

const assert = require('assert')
const fs = require('fs')
const Eth = require('ethjs')
const ganachelib = require('ganache-cli')

const config = require('config')['test']

const endpoint = config['endpoint']
const gasLimit = config['gasLimit']
const gasPrice = config['gasPrice']

// Re-enable when you figure out what's wrong with programmatic
// ganache
//KEYS_PATH="./keys/ganache.test.json"
//ganache = ganachelib.provider({account_keys_path: KEYS_PATH})
//web3.setProvider(ganache)
const eth = new Eth(new Eth.HttpProvider(endpoint));

keys = JSON.parse(fs.readFileSync(`keys/ganache.test.json`).toString()).addresses

accounts = []
//keys = ganache.manager.state.accounts

coinbase = null;
for (var key in keys) {
  accounts.push(key)
}
coinbase = accounts[0]
console.log(`First test key found (coinbase): ${coinbase}`);

class TestHarness {
  constructor(contractName) {
    this.contractName = contractName;
    console.log(`CONTRACT NAME ${contractName}`)

    var output = JSON.parse(fs.readFileSync(`outputs/${contractName}.json`).toString())
    assert(output.code && output.abi)
    this.code = '0x' + output.code
    this.abi = output.abi
    //console.log(`ABI ${JSON.stringify(this.abi)}`)

    this.eth = eth 
    this.accounts = accounts
  }

  // Takes a partial function that depends on a map of options
  // and we also add a callback that accepts (err, result) Node.js style
  runFunc(partial_func) {
    return new Promise((resolve, reject) => {
      partial_func({from: coinbase, gas: gasLimit, gasPrice: gasPrice},
        (err, result) => {
          if (err) { reject(err); }
          else {
            this.result = result
            resolve(this);
          } // keep passing the harness object
        });
      }
    );
  }

  deployPromise() {
    return new Promise((resolve, reject) => {
      eth.contract(this.abi).new({data: this.code, from: coinbase, gas: gasLimit, gasPrice: gasPrice},
        (err, contract) => {
          if (err) {
            console.error("Error " + err);
            reject(err);
          } else if (contract.address) {
            console.log(`Contract ${this.contractName} deployed at ${contract.address}`)
            this.address = contract.address
            this.instance = eth.contract(this.abi).at(this.address)
            resolve(this);
          }
        });
    });
  }

}

module.exports = TestHarness
