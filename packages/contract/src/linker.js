'use strict'

const assert = require('chai').assert
const { List, Map, OrderedMap } = require('immutable')
const { Logger, isNetwork, getImmutableKey, setImmutableKey, LIB_PATTERN, LINKS_DIR }
             = require('demo-utils')
const LOGGER = new Logger('Linker')

const { isContract } = require('./contractsManager')
const { BuildsManager } = require('./buildsManager')
const { awaitOutputter, isDeploy, isLink } = require('./utils')
const { keccak } = require('ethereumjs-util')
const solcLinker = require('solc/linker')

const linker = {}

linker.Linker = class {

  constructor({inputter, outputter, bm}) {
    this.bm        = bm || new BuildsManager(...arguments)
  }

  getBuildsManager() {
    return this.bm
  }

  /**
   * Link a previously compiled contract. Validate dependencies and generate appropriate metadata
   * @param eth network object connected to a local provider
   * @param contractName {String} the name of the contract to link.
   * @param linkId {String} the link ID to output the new link as.
   * @param depMap is an Immutable Map of library names to deploy IDs
   * @return the contractOutput augmented with a linkDepMap
   */
  async link(contractName, linkId, _depMap) {
    const contract = await this.bm.getContract(contractName)
    assert( isContract(contract),
           `Compile output for ${contractName} invalid: ${JSON.stringify(contract)}` )
    const code = '0x' + contract.get('code')
    const _linkId = linkId || 'link'
    const linkName = `${contractName}-${_linkId}`

    const link = await this.bm.getLink(linkName)
    const inputHash = keccak(JSON.stringify(contract.toJS())).toString('hex')
    if ( isLink(link) && link.get('inputHash') === inputHash ) {
      LOGGER.info(`${linkName} is up-to-date`)
      LOGGER.debug(`with hash ${inputHash}`)
      return link
    } else {
      LOGGER.debug(`${linkName} out-of-date, re-linking`)
      LOGGER.debug(`with input hash ${inputHash}`)
    }

    /* 
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

    if (matches.count() === 0 && _depMap && _depMap.count() > 0) {
      throw new Error(`No matches to replace with link map ${JSON.stringify(depMap)}`)
    }

    if (matches.count() > 0 && (!_depMap || _depMap.count() == 0)) {
      throw new Error(`No link map found to replace ${JSON.stringify(matches)}`)
    }

    const depMap = Map.isMap(_depMap) ? _depMap : new Map({})

    const replacedCode = await depMap.reduce(async (codeSoFar, deployId, contractName) => {
      // The linkId to replace for the given linkName can also
      // be a full deployName by itself (e.g. TestInterface=TestImpl-deploy)
      // in which case, deployId == `TestImpl-deploy` directly
      // instead of `TestInterface-deploy`
      const deployName = (deployId.startsWith('deploy')) ?
        `${contractName}-${deployId}` : deployId
      const linkPlaceholder = matches.get(contractName)
      if (!linkPlaceholder) {
        throw new Error(`Placeholder for dependency ${linkPlaceholder} not found in bytecode.`)
      }

      const deployObject = await this.bm.getDeploy(deployName)
      if (!isDeploy(deployObject)) { throw new Error(`Deploy ${deployName} not deployed`) }
      LOGGER.debug('DEPLOY OBJECT', deployObject)

      const deployAddress = deployObject.get('deployAddress')
      assert(deployAddress, `Null deployAddress`)

      LOGGER.debug(`Replacing symbols ${linkPlaceholder} with ${deployAddress.slice(2)}`)
      while (codeSoFar.search(linkPlaceholder) !== -1) {
        codeSoFar = codeSoFar.replace(linkPlaceholder, deployAddress.slice(2))
      }
      return codeSoFar
    }, code)

    assert(replacedCode.match(LIB_PATTERN) === null) // All placeholders should be replaced
*/
    const deploys = await this.bm.getDeploys()
    const depMap = Map.isMap(_depMap) ? _depMap : new Map({})
    const replaceMap = depMap.map((deployId, contractName) => deploys.get(`${contractName}-${deployId}`).get('deployAddress')).mapKeys((k) => k+'.sol:'+k).toJS()

    LOGGER.debug('replaceMap', replaceMap)

    const replacedCode = solcLinker.linkBytecode(code, replaceMap)

    const now = new Date()

    const linkOutput = new OrderedMap({
      type           : 'link',
      name           : contractName,
      linkId         : linkId,
      linkMap        : depMap,
      linkDate       : now.toLocaleString(),
      linkTime       : now.getTime(),
      code           : replacedCode,
      abi            : contract.get('abi'),
      inputHash      : inputHash,
    })

    // This is an updated link, overwrite it
    return this.bm.setLink(linkName, linkOutput, true)
  }

}

module.exports = linker
