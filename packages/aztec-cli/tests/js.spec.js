'use strict'
const BN = require('bn.js')
const randombytes = require('randombytes')
const { doCxAmount, doMintAmount, getLastResult } = require('..')
const { getConfig, Logger } = require('demo-utils')
const { wallet } = require('demo-keys')
const { parsed } = require('dotenv').config()
const { Map, List } = require('immutable')
const { keccak } = require('ethereumjs-util')
const { abiEncoder : { outputCoder } } = require('aztec.js')
const chai = require('chai')
const assert = chai.assert
const expect = chai.expect
chai.use(require('chai-as-promised'))

const { proofs : { JOIN_SPLIT_PROOF } } = require('@aztec/dev-utils')

const LOGGER = new Logger('cx.spec')

describe('ACE validateProofByHash', () => {

  const tradeSymbol = 'AAA'
  const DEPLOYER_ADDRESS = getConfig()['DEPLOYER_ADDRESS']
  const DEPLOYER_PASSWORD = getConfig()['DEPLOYER_PASSWORD']
  const DEPLOYER_PUBLIC_KEY = '0x04b56dcc4375e855adba8f37a2a9cce64809b3d24d1981daa7c9e3f98316676b06b27a85b889559c09ad442f2636491ceb6930589cee609258df8da29e852a1312'

  it('succeed transferring whole amount then validating proof by hash', async () => {

    const senderNoteHash = await doMintAmount({
      amount: new BN(500),
      senderIndex      : 1,
      testAccountIndex : 3,
    })
    
    // Do the thing; transfers and also validates
    const cxResult = (await doCxAmount({
      amount           : 0,
      senderNoteHash,
      transferAll      : true,
      senderIndex      : 1,
      testAccountIndex : 3,
    })).toJS()
    
    const proofData = cxResult.unlabeled.jsProofData
    assert( proofData, `jsProofData missing from unlabeled substate` )
    assert( JOIN_SPLIT_PROOF, `JOIN_SPLIT_PROOF constants` )

    const transfererAddress = cxResult.unlabeled.transfererAddress
    assert( transfererAddress, `transfererAddress is missing` )

    assert( cxResult.unlabeled.zkToken.address, `zkToken address missing` )

    // validates proof by hash
    // This is a view function, so no need for minedTx
    const proofOutput = outputCoder.getProofOutput(cxResult.unlabeled.jsProofOutputs, 0);
    LOGGER.info('proofOutputs', cxResult.unlabeled.jsProofOutput)
    LOGGER.info('proofOutput', proofOutput)
    const proofHash = outputCoder.hashProofOutput(proofOutput);
    LOGGER.info('proofHash', proofHash)
    //const proofHash = keccak(cxResult.unlabeled.jsProofOutput.slice(2)).toString('hex')

    //assert.equal( cxResult.unlabeled.jsProofHash, proofHash, `Proof hashes don't match` )
    
    const randomHash = '0x' + randombytes(32).toString('hex')

    const ace = await cxResult.deployed('ACE')
    const validateResult = await cxResult.minedTx( ace.validateProof,
      [JOIN_SPLIT_PROOF, transfererAddress, proofData]
    )
    LOGGER.info('validateResult')
    const validateResult2 = await ace.validateProofByHash(
      JOIN_SPLIT_PROOF, proofHash, cxResult.unlabeled.zkToken.address
    )
    LOGGER.info('validateResult2')
    assert( Boolean(validateResult2['0']),
      `Cannot validate previous proof with hash ${proofHash} at token address ${cxResult.unlabeled.zkToken.address}`
    )
    
    // Expect this to fail, a random hash we have never seen before and is not even a real proof
    const validateResult3 = await ace.validateProofByHash(JOIN_SPLIT_PROOF, randomHash, cxResult.unlabeled.zkToken.address)
    LOGGER.info('validateResult3')
    assert.notOk( Boolean(validateResult3['0']), `Should not cache / validate a proof for a random hash ${randomHash}` )

/*
    const result = await ace.validateProofByHash(
      JOIN_SPLIT_PROOF,
      proofHash,
      cxResult.unlabeled.transfererAddress,
    )
    */
    //LOGGER.info('validateProofByHash result', validateResult)
  })

  after(() => {
    wallet.shutdownSync()
  })

})
