'use strict';

const assert = require('chai').assert
const { ContractsManager, isContract } = require('..');
const { getNetwork } = require('@democracy.js/utils')

describe('ContractsManager tests', () => {
  
  let cm

  before(async () => {
    const eth = getNetwork()
    const chainId = await eth.net_version()
    cm = new ContractsManager('contracts', null, null, chainId)
  })

  it( 'finds a previous compile', async () => {
    const out = await cm.getContract('TestLibrary')
    assert(isContract(out))
  })

});
