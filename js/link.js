// Linking command, for detecting library dependencies and generating
// link metadata as an input to deploying
const fs = require('fs');
const { traverseDirs } = require('./utils')

const config = require('config')
const assert = require('assert')
const { Map } = require('immutable')

/**
 * Validate dependencies and generate appropriate metadata
 * @param eth network object connected to a local provider
 * @param contractOutput the JSON compiled output to deploy
 * @param depMap is an Immutable Map of library names to deploy IDs
 * @return the contractOutput augmented with a linkDepMap
 */
async function link(contractOutput, eth, depMap) {
  const networkId = await eth.net_version() 
  const code = "0x" + contractOutput.bytecode
  const abi = contractOutput.abi
  const contractName = contractOutput['name']

  deployMap = {}

  // Load all previous deploys
  traverseDirs(
    [`deploys/${networkId}`],
    (fnParts) => { return (fnParts.length > 1 && !fnParts[1].startsWith('json')) },
    // Deploy names will have the form <contractName>-<deployID>, do we need to 
    // differentiate different deploy IDs for a single contract name?
    (source,f) => { deployMap[path.basename(f)] = JSON.parse(source) }
  )

  const LIB_PATTERN = /__(([a-zA-Z])+\/*)+\.sol:[a-zA-Z]+_+/g
  const matches = code.match(LIB_PATTERN)

  if (!depMap || depMap.count() == 0) {
    console.log(`Symbols to replace ${JSON.stringify(matches)}`)
  }

  linkDepMap = Map({})
  depMap.map((v, k) => {
    let indexMatch = matches.indexOf(k)
        deployAddress = deployMap[deployName]['deployAddress']
        deployName = `${k}-${v}`
    if (!deployMap[deployName]) { throw new Error(`${deployName} not deployed`) }
    if (indexMatch == -1) {
      throw new Error(`Placeholder for dependency ${k} not found in bytecode.`);
    }
    console.log(`Replacing symbols ${matches[i]} with ${deployAddress}`)
    code.replace(matches[i], deployAddress)

    linkDepMap = linkDepMap.set(k, {
      deployId: v,
      address: deployAddress
    })
  })

  return contractOutput.set('linkDepMap', linkDepMap)
}

module.exports = link
