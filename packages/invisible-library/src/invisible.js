const Contract = require('./contract')
const util = require('ethereumjs-util')
const { Logger } = require('@democracy.js/utils')
const LOGGER = new Logger('InvisibleLibrary', ['info','debug','warn','error'])
const { Range } = require('immutable')
const assert = require('chai').assert

class InvisibleLibrary extends Contract {
  
  constructor(_eth, _deploy, _senderAddress) {
    super(_eth, _deploy)
    util.isValidAddress(_senderAddress)
    this.senderAddress = _senderAddress
  } 

  async postArtifact(_photoURL, _shortDesc, _longDescURL) {
    return this.getTxReceipt(
      this.getInstance().postArtifact(_photoURL, _shortDesc, _longDescURL,
                                      {from: this.senderAddress,
                                       gas: 3000000})
    )
  }

  async claimArtifact(_id, _claimBlockNumber) {
    return this.getTxReceipt(
      this.getInstance().claimArtifact(_id, _claimBlockNumber,
                                       {from: this.senderAddress,
                                        gas: 30000})
    )
  }

  async takeArtifact(_id) {
    return this.getTxReceipt(
      this.getInstance().takeArtifact(_id, {from: this.senderAddress,
                                            gas: 30000})
    )
  }

  async getArtifactCount() {
    const count = await this.getInstance().nextId({from: this.senderAddress})
    return Number(count['0'])
  }

  async getArtifacts() {
    const count = await this.getArtifactCount()
    assert.typeOf(count, 'Number')
    LOGGER.info(`Artifact Count`, count)
    return Promise.all(Range(0, count).map(async (i) => {
      const art = await this.getInstance().artifacts(i, {from: this.senderAddress})
      LOGGER.info(art)
      return art
    }).toJS())
  }
}

module.exports = InvisibleLibrary
