// Confidential transfer of an amount from a sender to a receiver with change back.
'use strict'
const BN        = require('bn.js')
const { Map }   = require('immutable')
const util      = require('ethereumjs-util')
const assert    = require('chai').assert

const aztec     = require('aztec.js')
const { constants, proofs }
                = require('@aztec/dev-utils')
const secp256k1 = require('@aztec/secp256k1') 

const { fromJS, toJS, Logger, getConfig }
                = require('demo-utils')
const { isAccount }
                = require('demo-keys')
const { checkPublicKey } = require('./utils')

const LOGGER    = new Logger('cxFunc')

const statusMap = {
  '0': 'OFFCHAIN',
  '1': 'UNSPENT',
  '2': 'SPENT',
}

const statusFunc = async (state) => {
  const {
    bm, wallet, chainId, deployed, minedTx, deployerAddress, tradeSymbol,
    ownerAddress, noteHash,
  } = state.toJS()

  // VALIDATE INCOMING PARAMETERS

  const erc20Token         = await deployed( 'TestERC20',
    {deployID: `deploy${tradeSymbol}` } )
  const ace                = await deployed( 'ACE' )
  const token              = await deployed( 'ZkAssetTradeable',
    { deployID: `deploy${tradeSymbol}` } )
  LOGGER.info('ACE'                              , ace.address)
  LOGGER.info('ZkAsset (Registry Owner) Address ', token.address)
  LOGGER.info('Note Owner Address '              , ownerAddress)
  LOGGER.info('Deployer Address '                , deployerAddress)

  const buildReadKey = ({ ownerAddress, noteHash }) => {
    return `zkNotes/${chainId}/${ownerAddress}/${token.address}/${noteHash}`
  }
  
  // Sending information
  const noteKey = buildReadKey({
    ownerAddress : ownerAddress,
    noteHash     : noteHash
  })
  const noteRaw         = await bm.inputter(noteKey)
  const note            = await aztec.note.fromViewKey(noteRaw.get('viewingKey'))
  const noteValue = new BN(parseInt(note.k))
  LOGGER.debug('Note URL'  , noteKey)
  LOGGER.debug('Note Value', noteValue.toNumber())

  const noteInfo = await ace.getNote(token.address, noteHash)
  LOGGER.info(`NoteInfo for registry owner ${token.address} and note hash ${noteHash}`,
    noteInfo)
  
  return Map({
    'status'      : statusMap[noteInfo['status']],
    'createdOn'   : noteInfo['createdOn'],
    'destroyedOn' : noteInfo['destroyedOn'],
    'noteOwner'   : noteInfo['noteOwner'],
  })
}

module.exports = { statusFunc }
