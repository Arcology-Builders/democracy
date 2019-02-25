// Linking command, for detecting library dependencies and generating
// link metadata as an input to deploying
const fs     = require('fs')
const path   = require('path')

const config = require('config')
const assert = require('assert')
const { List, Map }
             = require('immutable')
const { print, ensureDir, traverseDirs, getDeploys, getLink, isDeploy, LIB_PATTERN, LINKS_DIR }
             = require('@democracy.js/utils')

/**
 * Validate dependencies and generate appropriate metadata
 * @param eth network object connected to a local provider
 * @param contractOutput the JSON compiled output to deploy
 * @param depMap is an Immutable Map of library names to deploy IDs
 * @return the contractOutput augmented with a linkDepMap
 */
async function link(contractOutput, eth, deployerAddress, linkId, depMap) {
  const networkId = await eth.net_version() 
  const code = '0x' + contractOutput.get('code')
  const contractName = contractOutput.get('name')
  const linkName = `${contractName}-${linkId}`

  linksDir = path.join(LINKS_DIR, networkId)
  ensureDir(LINKS_DIR)
  ensureDir(linksDir)

  assert(!getLink(networkId, linkName), `Link ${linkName} already exists`)

  deployMap = getDeploys(networkId)

  let matches = Map({})
  let match
  while (match = LIB_PATTERN.exec(code)) {
    assert(match[0], `Match expression not found in ${code}`)
    assert(match[1], `Match group not found ${code}`)
    console.log(`Match found ${JSON.stringify(match)}`)
    if (matches.has(match[1])) { assert.eq(match[0], matches.get(match[1])); continue }
    matches = matches.set(match[1], match[0])
  }
  console.log(`matches ${matches.toString()}`)

  if (!matches && depMap && depMap.count() > 0) {
    throw new Error(`No matches to replace with link map ${JSON.stringify(depMap)}`)
  }

  if (matches && (!depMap || depMap.count() == 0)) {
    throw new Error(`No link map found to replace ${JSON.stringify(matches)}`)
  }

  const replacedCode = depMap.reduce((codeSoFar, linkId, linkName) => {
    const deployName = `${linkName}-${linkId}`
    //console.log(`deployName ${deployName}`)
    const linkPlaceholder = matches.get(linkName)
    if (!linkPlaceholder) {
      throw new Error(`Placeholder for dependency ${linkPlaceholder} not found in bytecode.`)
    }

    const deployObject = deployMap.get(deployName)
    if (!isDeploy(deployObject)) { throw new Error(`Deploy ${deployName} not deployed`) }
    print(deployObject)

    const deployAddress = deployObject.get('deployAddress')
    assert(deployAddress)

    console.log(`Replacing symbols ${linkPlaceholder} with ${deployAddress.slice(2)}`)
    while (codeSoFar.search(linkPlaceholder) !== -1) {
      codeSoFar = codeSoFar.replace(linkPlaceholder, deployAddress.slice(2))
    }
    return codeSoFar
  }, code)

  assert(replacedCode.match(LIB_PATTERN) === null) // All placeholders should be replaced

  const now = new Date()

  const linkOutput = new Map({
    type           : 'link',
    name           : contractName,
    networkId      : networkId,
    linkId         : linkId,
    linkMap        : depMap,
    linkDate       : now.toLocaleString(),
    linkTime       : now.getTime(),
    deployerAddress: deployerAddress,
    code           : replacedCode,
    abi            : contractOutput.get('abi'),
  })

  linkFilePath = path.join(linksDir, linkName) + '.json'

  console.log(`Writing link to ${linkFilePath}`)
  const linkString = JSON.stringify(linkOutput.toJS(), null, '  ')
  //console.log(linkString)
  fs.writeFileSync(linkFilePath, linkString)

  return linkOutput
}

module.exports = link
