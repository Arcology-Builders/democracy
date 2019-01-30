const fs = require('fs');
const { traverseDirs } = require('./utils')

config = require('config')

async function deploy(eth, contractOutput) {
  const networkId = await eth.net_version() 
  code = "0x" + contractOutput.bytecode
  abi = contractOutput.abi

  deployMap = {}

  traverseDirs(
    ['deploys/networkId'],
    (fnParts) => { return (fnParts.length > 1 && 

  const LIB_PATTERN = /__(([a-zA-Z])+\/*)+\.sol:[a-zA-Z]+__/g
  const matches = code.match(LIB_PATTERN)
  if (matches) {
    console.log("Library Symbols to Replace: ")
    console.log(JSON.stringify(matches))
    code.replace(LIB_PATTERN, "eec918d74c746167564401103096D45BbD494B74")
  }

web3.eth.contract(abi).new({data: code, from: coinbase, gas: "6700000", gasPrice: "0x21105b0"}, function(err, contract) {
  if (err) {
    console.error("Error " + err);
    return;
  } else if (contract.address) {
    console.log('address: ' + contract.address);
  }
});
