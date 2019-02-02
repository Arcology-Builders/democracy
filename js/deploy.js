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
async function deploy(contractOutput, eth, deployerAddr, deployId, linkMap) {
  console.log(`Deploying ${contractOutput['name']} with id ${deployId}`)
  const networkId = await eth.net_version() 
  const code = "0x" + contractOutput.bytecode
  const abi = contractOutput.abi
  const contractName = contractOutput['name']
  const deployName = `${contractName}-${deployId}`
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
    deployError = `Contract "${contractName}" has already been deployed on this chain with ID "${deployId}"`
    console.error(deployError)
    return { ...deployError }
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
      (err, txHash) => {
        if (err) {
          console.error("Error " + err)
	  reject(err)
        }
        const checkTransaction = setInterval(() => {
          eth.getTransactionReceipt(txHash).then((receipt) => {
            if (receipt) {
	      clearInterval(checkTransaction)
	      resolve(receipt) 
            }
          })
        })
      }
    )
  })

  const minedContract = await deployPromise.then((receipt) => { return receipt })
  console.log(JSON.stringify(minedContract, null, "  "))

  const now = new Date()

  const deployOutput = {
    name: contractName,
    networkId: networkId,
    deployId: deployId,
    linkMap: linkMap,
    deployTx: minedContract,
    deployAddress: minedContract.contractAddress,
    deployDate: now.toLocaleString(),
    deployTime: now.getTime()
    }

  console.log(`Writing deploy to ${deployDir}`)
  console.log(JSON.stringify(deployOutput, null, '  '))
  fs.writeFileSync(path.join(deployDir, deployName), JSON.stringify(deployOutput, null, '  '));

  return deployOutput
}

module.exports = deploy
