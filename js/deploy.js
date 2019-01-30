const fs = require('fs');
const { traverseDirs } = require('./utils')

const config = require('config')
const assert = require('assert')
const { Seq } = require('immutable')

/**
 * Validate dependencies then deploy the given contract output to a network.
 * @param eth network object connected to a local provider
 * @param contractOutput the JSON compiled output to deploy
 */
async function deploy(eth, contractOutput, deployId) {
  const networkId = await eth.net_version() 
  const code = "0x" + contractOutput.bytecode
  const abi = contractOutput.abi
  const contractName = contractOutput['name']
  const deployName = `${contractName} - ${deployId}`
  // Deps are of the form [ { 'libraryName': ..., 'deployId': ..., 'address':, 'deployTime': ...} ]
  const deps = contractOutput['libraryDeps']

  deployMap = {}

  // Load all previous deploys
  traverseDirs(
    ['deploys/networkId'],
    (fnParts) => { return (fnParts.length > 1 && !fnParts[1].startsWith('json')) },
    // Deploy names will have the form <contractName>-<deployID>, do we need to 
    // differentiate different deploy IDs for a single contract name?
    (source,f) => { deployMap[path.basename(f)] = JSON.parse(source) }
  )

  if (deployMap[deployName]) {
    console.error(`Contract "${contractName}" has already been deployed on this chain with ID "${deployId}"`)
  }
  const LIB_PATTERN = /__(([a-zA-Z])+\/*)+\.sol:[a-zA-Z]+_+/g
  const matches = code.match(LIB_PATTERN)

  matches.map((dep) => {
    let deployName = `${dep['libraryName']-dep['deployId']}`
    if (!deployMap[deployName]) { throw new Error(`undeployed library dependency ${deployName}`) }
    if (!matches)    
  if (matches) {
    console.log("Library Symbols to Replace: ")
    console.log(JSON.stringify(matches))
    code.replace(LIB_PATTERN, "eec918d74c746167564401103096D45BbD494B74")
  }

  eth.contract(abi).new({data: code, from: coinbase, gas: "6700000", gasPrice: "0x21105b0"}, function(err, contract) {
  if (err) {
    console.error("Error " + err);
    return;
  } else if (contract.address) {
    console.log('address: ' + contract.address);
  }
});
