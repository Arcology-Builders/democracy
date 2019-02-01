const fs = require('fs');
const { traverseDirs } = require('./utils')

const config = require('config')
const assert = require('assert')
const { Seq } = require('immutable')

const DEPLOY_DIR = "deploys"

function ensureDirectory(dirName) {
  if (!fs.existsSync(dirName)) { fs.mkdirSync(dirName) }
}

/**
 * Validate dependencies then deploy the given contract output to a network.
 * @param eth network object connected to a local provider
 * @param contractOutput the JSON compiled output to deploy
 */
async function deploy(eth, deployerAddr, contractOutput, deployId, linkMap) {
  console.log(`Deploying ${contractOutput['name']} with id ${deployId}`)
  const networkId = await eth.net_version() 
  const code = "0x" + contractOutput.bytecode
  const abi = contractOutput.abi
  const contractName = contractOutput['name']
  const deployName = `${contractName} - ${deployId}`
  // Deps are of the form [ { 'libraryName': ..., 'deployId': ..., 'address':, 'deployTime': ...} ]
  const deps = contractOutput['libraryDeps']

  deployMap = {}

  deployDir = path.join(DEPLOY_DIR, networkId)
  ensureDirectory(deployDir)

  // Load all previous deploys
  traverseDirs(
    [deployDir],
    (fnParts) => { return (fnParts.length > 1 && !fnParts[1].startsWith('json')) },
    // Deploy names will have the form <contractName>-<deployID>, do we need to 
    // differentiate different deploy IDs for a single contract name?
    (source,f) => { deployMap[path.basename(f)] = JSON.parse(source) }
  )

  // Warn with multiple deploys with the same ID
  if (deployMap[deployName]) {
    console.error(`Contract "${contractName}" has already been deployed on this chain with ID "${deployId}"`)
  }
  const LIB_PATTERN = /(__(([a-zA-Z])+\/*)+\.sol:[a-zA-Z]+_+)/g
  const matches = code.match(LIB_PATTERN)

  console.log(`Matches ${JSON.stringify(matches)}`)

  if (matches) {
    matches.map((linkName) => {
      let linkDeployId = linkMap[linkName]
      if (!linkDeployId) { throw new Error(`no deploy ID provided for link ${linkName}`) }
      let linkDeployName = `${linkName}-${linkDeployId}`
      if (!deployMap[deployName]) { throw new Error(`undeployed library dependency ${deployName}`) }
      let deployedAddress = deployMap[linkDeployName]['deployedAddress']
      console.log("Library Symbols to Replace: ${linkName} with ${deployedAddress}")
      console.log(JSON.stringify(matches))
      code.replace(dep, deployedAddress)
    })
  }

  deployPromise = new Promise((resolve, reject) => {
    eth.contract(abi).new({data: code, from: deployerAddr, gas: "6700000", gasPrice: "0x21105b0"},
      function(err, data) {
        if (err) {
          console.error("Error " + err)
	  reject(err)
        } else if (data) {
	  console.log(JSON.stringify(data))
	  resolve(data)
	}
      }
      )
  })

  console.log(`Deploy Dor ${deployDir}`)
  const minedContract = await deployPromise.then((contract) => {return contract} );

  const deployOutput = {
    name: contractName,
    deployId: deployId,
    linkDepMap: linkDepMap,
    deployAddress: minedContract.address,
    deployTime: new Date().getTime()
    }

  fs.writeFileSync(path.join(deployDir, deployName), deployOutput);

  return deployOutput

}

module.exports = deploy
