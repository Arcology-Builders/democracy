// Linking command, for detecting library dependencies and generating
// link metadata as an input to deploying
const fs = require('fs');

const config = require('config')
const assert = require('assert')
const { Map } = require('immutable')
const { print, ensureDir, traverseDirs, getDeploys } = require('./utils')
const { getLink } = require('./utils')

LINKS_DIR = 'links'

/**
 * Validate dependencies and generate appropriate metadata
 * @param eth network object connected to a local provider
 * @param contractOutput the JSON compiled output to deploy
 * @param depMap is an Immutable Map of library names to deploy IDs
 * @return the contractOutput augmented with a linkDepMap
 */
async function link(contractOutput, eth, deployerAddress, linkId, depMap) {
  const networkId = await eth.net_version() 
  const code = "0x" + contractOutput.get('code')
  const contractName = contractOutput.get('name')
  const linkName = `${contractName}-${linkId}`

  linksDir = path.join(LINKS_DIR, networkId)
  ensureDir(linksDir)

  assert(!getLink(networkId, linkName))

  deployMap = getDeploys(networkId)

  const LIB_PATTERN = /__([a-zA-Z]+\.sol):([a-zA-Z]+)_+/g
  const matches = LIB_PATTERN.exec(code)

  if (!depMap || depMap.count() == 0) {
    throw new Error(`No link map found to replace ${JSON.stringify(matches)}`)
  }

  const replacedCode = depMap.reduce((codeSoFar, linkId, linkPlaceholder) => {
    const deployName = `${linkPlaceholder}-${linkId}`
    console.log(`deployName ${deployName}`)
    const indexMatch = matches.indexOf(linkPlaceholder)
    if (indexMatch == -1) {
      throw new Error(`Placeholder for dependency ${linkPlaceholder} not found in bytecode.`);
    }

    const deployObject = deployMap.get(deployName)
    if (!deployObject) { throw new Error(`${deployName} not deployed`) }
    print(deployObject)

    const deployAddress = deployObject.get('deployAddress')
    assert(deployAddress)

    console.log(`Replacing symbols ${matches[indexMatch]} with ${deployAddress}`)
    return codeSoFar.replace(matches[0], deployAddress.slice(2))
  }, code)

  assert(replacedCode.match(LIB_PATTERN) === null) // All placeholders should be replaced

  const now = new Date()

  const linkOutput = Map({
    name: contractName,
    networkId: networkId,
    linkId: linkId,
    linkMap: depMap,
    linkDate: now.toLocaleString(),
    linkTime: now.getTime(),
    deployerAddress: deployerAddress,
    }).merge(contractOutput.set('code', replacedCode))

  linkFilePath = path.join(linksDir, linkName)

  console.log(`Writing link to ${linkFilePath}`)
  const linkString = JSON.stringify(linkOutput, null, '  ')
  console.log(linkString)
  fs.writeFileSync(linkFilePath, linkString)

  return linkOutput
}

module.exports = link
