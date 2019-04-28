const path   = require('path')
const assert = require('chai').assert
const { Map, List, Seq }
             = require('immutable')

const { DEPLOYS_DIR, Logger, getImmutableKey, setImmutableKey }
             = require('demo-utils')
const LOGGER = new Logger('Deployer')
const { awaitOutputter } = require('./utils')
const { BuildsManager } = require('./buildsManager')
const { isValidAddress, keccak } = require('ethereumjs-util')

class Deployer {

  constructor({inputter, outputter, bm, eth, chainId, address}) {
    assert(chainId, `chainId param is empty.`)
    this.inputter  = inputter || getImmutableKey
    this.outputter = outputter || setImmutableKey
    this.bm        = bm || new BuildsManager(...arguments)
    this.eth       = eth
    this.chainId   = chainId
    assert(isValidAddress(address), `${address} not a valid ethereum address`)
    this.address   = address
  }

  getBuildsManager() {
    return this.bm
  }

  /**
   * Validate dependencies then deploy the given contract output to a network.
   * @param eth network object connected to a local provider
   * @param contractOutput the JSON compiled output to deploy
   */
  async deploy(contractName, linkId, deployId, ctorArgs) {
    const linkName   = `${contractName}-${linkId}`
    const link       = await this.bm.getLink(linkName)
    const code       = link.get('code')
    const abi        = link.get('abi')
    const deployName = `${contractName}-${deployId}`
   
    assert.equal(this.chainId, await this.eth.net_version())

    const deployMap = await this.bm.getDeploys()

    const inputHash = keccak(JSON.stringify(link.toJS())).toString('hex')
    // Warn with multiple deploys with the same ID
    const deploy = deployMap[deployName]
    if (deploy && deploy.get('inputHash') === inputHash) {
      deployError = `Contract "${contractName}" has already been deployed on chain with ID "${deployId} and hash ${inputHash}`
      LOGGER.warn(deployError)
      return deployMap[deployName]
    } else {
      LOGGER.info(`Deploy ${deployName} is out-of-date with hash ${inputHash}`)
    }

    const ctorArgList = Map.isMap(ctorArgs) ? List(ctorArgs.values()).toJS() : new Map({})
    LOGGER.debug(ctorArgList)

    const Contract = this.eth.contract(abi.toJS(), code)

    const deployPromise = new Promise((resolve, reject) => {
      Contract.new(...ctorArgList, {
        from: this.address, gas: '6700000', gasPrice: '0x21105b0'
      }).then((txHash) => {
          const checkTransaction = setInterval(() => {
            this.eth.getTransactionReceipt(txHash).then((receipt) => {
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
    LOGGER.debug('MINED', minedContract)
    const instance = Contract.at(minedContract.contractAddress)

    const now = new Date()

    const deployOutput = new Map({
      type         : 'deploy',
      name         : contractName,
      chainId      : this.chainId,
      deployId     : deployId,
      linkId       : link.get('linkId'),
      abi          : abi,
      code         : code,
      deployTx     : new Map(minedContract),
      deployAddress: minedContract.contractAddress,
      deployDate   : now.toLocaleString(),
      deployTime   : now.getTime(),
      inputHash    : inputHash,
    })

    const deployFilePath = `${DEPLOYS_DIR}/${this.chainId}/${deployName}`
    LOGGER.debug(`Writing deploy to ${deployFilePath}`)
    
    return awaitOutputter(this.outputter(deployFilePath, deployOutput, true),
                          () => { return deployOutput })
  }

}

/**
 * @return true if the given object is a deploy output, otherwise false
 */
const isDeploy = (_deploy) => {
  return (_deploy && _deploy.get('type') === 'deploy')
}

module.exports = {
  Deployer: Deployer,
  isDeploy: isDeploy,
}
