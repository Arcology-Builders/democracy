const fs = require('fs')
const path = require('path')
const { traverseDirs, ensureDir, DEPLOYS_DIR } = require('@democracy.js/utils')

const config = require('config')
const assert = require('assert')
const { Map, List, Seq } = require('immutable')
const BN = require('bn.js')

/**
 * Validate dependencies then deploy the given contract output to a network.
 * @param eth network object connected to a local provider
 * @param contractOutput the JSON compiled output to deploy
 */
async function deploy(eth, link, deployId, ctorArgs) {
  const contractName = link.get('name')
  //console.log(`Deploying ${contractName} with id ${deployId}`)
  const networkId = await eth.net_version() 
  const code = link.get('code')
  const abi = link.get('abi')
  const deployName = `${contractName}-${deployId}`
  const deployerAddress = link.get('deployerAddress')
  //console.log(`ctor args ${ctorArgs.get('_abc')}`)

  deployMap = {}

  deployDir = path.join(DEPLOYS_DIR, networkId)
  ensureDir(DEPLOYS_DIR)
  ensureDir(deployDir)

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

  const ctorArgList = List(ctorArgs.values()).toJS()
  //console.log(`ctorArgList ${JSON.stringify(ctorArgList)}`)

  const Contract = eth.contract(abi.toJS(), code)

  deployPromise = new Promise((resolve, reject) => {
    Contract.new(...ctorArgList, {from: deployerAddress, gas: '6700000', gasPrice: '0x21105b0'})
      .then((txHash) => {
        const checkTransaction = setInterval(() => {
          eth.getTransactionReceipt(txHash).then((receipt) => {
            if (receipt) {
              clearInterval(checkTransaction)
              resolve(receipt) 
            }
          })
        })
      })
      .catch((error) => {
        console.error(`error ${error}`)
        reject(error)
      })
  })

  const minedContract = await deployPromise.then((receipt) => { return receipt })
  //console.log(JSON.stringify(minedContract, null, '  '))
  const instance = Contract.at(minedContract.contractAddress)

  const now = new Date()

  const deployOutput = new Map({
    type: 'deploy',
    name: contractName,
    networkId: networkId,
    deployId: deployId,
    linkId: link.get('linkId'),
    abi: abi,
    code: code,
    deployTx: minedContract,
    deployAddress: minedContract.contractAddress,
    deployDate: now.toLocaleString(),
    deployTime: now.getTime()
  })

  const deployFilePath = path.join(deployDir, deployName) + '.json'
  //console.log(`Writing deploy to ${deployFilePath}`)
  //console.log(JSON.stringify(deployOutput, null, '  '))
  fs.writeFileSync(deployFilePath, JSON.stringify(deployOutput.toJS(), null, '  '))

  return deployOutput
}

module.exports = deploy
