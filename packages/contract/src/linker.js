// Linking command, for detecting library dependencies and generating
// link metadata as an input to deploying
const fs     = require('fs')
const path   = require('path')

const assert = require('assert')
const { List, Map }
             = require('immutable')
const { Logger, getLink, isDeploy, getImmutableKey, setImmutableKey, LIB_PATTERN, LINKS_DIR }
             = require('@democracy.js/utils')
const LOGGER = new Logger('Linker')

class Linker {

  constructor(_eth, _inputter, _outputter) {
    this.eth       = _eth
    this.inputter  = _inputter  || getImmutableKey
    this.outputter = _outputter || setImmutableKey
    this.cm        = new ContractsManager("", this.inputter, this.outputter)
  }

  getContractsManager() {
    return this.cm
  }

  /**
   * Validate dependencies and generate appropriate metadata
   * @param eth network object connected to a local provider
   * @param contractOutput the JSON compiled output to deploy
   * @param depMap is an Immutable Map of library names to deploy IDs
   * @return the contractOutput augmented with a linkDepMap
   */
  async link(contractOutput, linkId, depMap) {
    const networkId = await this.eth.net_version() 
    const code = '0x' + contractOutput.get('code')
    const contractName = contractOutput.get('name')
    const linkName = `${contractName}-${linkId}`

    linksDir = path.join(LINKS_DIR, networkId)
    //ensureDir(LINKS_DIR)
    //ensureDir(linksDir)

    const link = await this.cm.getLink(networkId, linkName)
    assert(!isLink(link), `Link ${linkName} already exists`)

    const deployMap = await this.cm.getDeploys()

    let matches = Map({})
    let match
    while (match = LIB_PATTERN.exec(code)) {
      assert(match[0], `Match expression not found in ${code}`)
      assert(match[1], `Match group not found ${code}`)
      LOGGER.debug(`Match found ${JSON.stringify(match)}`)
      if (matches.has(match[1])) { assert.equal(match[0], matches.get(match[1])); continue }
      matches = matches.set(match[1], match[0])
    }
    LOGGER.debug(`matches ${matches.toString()}`)

    if (matches.count() === 0 && depMap && depMap.count() > 0) {
      throw new Error(`No matches to replace with link map ${JSON.stringify(depMap)}`)
    }

    if (matches.count() > 0 && (!depMap || depMap.count() == 0)) {
      throw new Error(`No link map found to replace ${JSON.stringify(matches)}`)
    }

    const replacedCode = depMap.reduce((codeSoFar, deployId, contractName) => {
      // The linkId to replace for the given linkName can also
      // be a full deployName by itself (e.g. TestInterface=TestImpl-deploy)
      // in which case, deployId == `TestImpl-deploy` directly
      // instead of `TestInterface-deploy`
      const deployName = (deployId.startsWith('deploy')) ?
        `${contractName}-${deployId}` : deployId
      //console.log(`deployName ${deployName}`)
      const linkPlaceholder = matches.get(contractName)
      if (!linkPlaceholder) {
        throw new Error(`Placeholder for dependency ${linkPlaceholder} not found in bytecode.`)
      }

      const deployObject = deployMap.get(deployName)
      if (!isDeploy(deployObject)) { throw new Error(`Deploy ${deployName} not deployed`) }
      print(deployObject)

      const deployAddress = deployObject.get('deployAddress')
      assert(deployAddress)

      LOGGER.debug(`Replacing symbols ${linkPlaceholder} with ${deployAddress.slice(2)}`)
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
      code           : replacedCode,
      abi            : contractOutput.get('abi'),
    })

    linkFilePath = `${linksDir}/${linkName}`

    LOGGER.debug(`Writing link to ${linkFilePath}`)
    this.outputter(linkFilePath, linkOutput)

    return linkOutput
  }

}

/**
 * @return true if the given object is a link output, otherwise false
 */
const isLink = (_link) => {
  return (_link && _link.get('type') === 'link')
}


module.exports = {
  Linker: Linker,
  isLink: isLink,
}
