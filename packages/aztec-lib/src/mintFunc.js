const BN         = require('bn.js')
const { Map }    = require('immutable')
const aztec      = require('aztec.js')
const secp256k1  = require('@aztec/secp256k1') 
const { constants, proofs: { MINT_PROOF} }
                 = require('@aztec/dev-utils')

const dotenv     = require('dotenv')
dotenv.config()

const { createTransformFromMap } = require('demo-transform')
const { AZTEC_TYPES: TYPES } = require('./utils')

const { fromJS, Logger }
                 = require('demo-utils')
const { wallet, isAccount }
                 = require('demo-keys')

const assert     = require('chai').assert
const util       = require('ethereumjs-util')
const LOGGER     = new Logger('mintFunc')

const mintFunc = async ({
    bm,
    chainId,
    deployed,
    minedTx,
    deployerAddress,
    tradeSymbol,
    minteeAddress,
    minteePublicKey,
    minteeAmount,
    mintFromZero,
  }) => {

  const erc20Token = await deployed( 'TestERC20', { deployID: `deploy${tradeSymbol}` } )
  console.log('ERC20 Token Address ', erc20Token.address)
  const token = await deployed( 'ZkAssetMintable', { deployID: `deploy${tradeSymbol}` } )
  LOGGER.info('Trade Symbol '           , tradeSymbol)
  LOGGER.info('ZkMintableAsset Address ', token.address)
  LOGGER.info('Deployer Address '       , deployerAddress)
  LOGGER.info('Mintee address'          , minteeAddress)
  LOGGER.info('Mintee public key'       , minteePublicKey)
  LOGGER.info('Mintee amount'           , minteeAmount)
  LOGGER.info('mintFromZero'            , mintFromZero)
  
  assert( minteeAmount.gte(0), 'Mintee amount must be greater than or equal to zero.' )
  assert( minteePublicKey.startsWith('0x04'), 'AZTEC public keys must start with 0x04' )
  const derivedAddress =
    util.toChecksumAddress(
      util.publicToAddress('0x' + minteePublicKey.slice(4)).toString('hex'))
  assert.equal(derivedAddress, minteeAddress,
    `Mintee address from pubKey was ${derivedAddress} instead of ${minteeAddress}`)

  const baseKey =`zkNotes/${chainId}/${minteeAddress}/${token.address}`
  const mintKey =`zkMintedTotals/${chainId}/${deployerAddress}/${token.address}`
  LOGGER.info(`Mint Key ${mintKey}`)

  const minteeNote = await aztec.note.create(minteePublicKey, minteeAmount)
  LOGGER.info(`Created new mintee note ${minteeNote.noteHash}`)

  let oldTotalNote, oldTotalNoteHash, mintedFromZero
  try { 
    if (mintFromZero) { throw new Error('Minting from zero.') }
    const oldTotalNoteRaw = await bm.inputter(mintKey)
    LOGGER.info('oldTotalNoteRaw', oldTotalNoteRaw)
    oldTotalNoteHash = oldTotalNoteRaw.get('zkNoteHash')
    const oldTotalNoteViewingKey = oldTotalNoteRaw.get('viewingKey')
    oldTotalNote = await aztec.note.fromViewKey(oldTotalNoteViewingKey)
    LOGGER.info(`retrieved old minted total note with hash ${oldTotalNoteHash}`)
    LOGGER.info(`viewing key ${oldTotalNoteViewingKey}`)
    LOGGER.debug(`k ${oldTotalNote.k}`)
    mintedFromZero = false
  } catch(e) {
    console.error(e)
    oldTotalNote = await aztec.note.createZeroValueNote()
    LOGGER.info(`created zero old minted total note with hash ${oldTotalNote.noteHash}`)
    mintedFromZero = true
  }

  const oldMintedTotal = new BN(oldTotalNote.k)
  
  LOGGER.debug(`old minted total ${oldMintedTotal}`)
 
  const newMintedTotal      = oldMintedTotal.add(minteeAmount)
  const newTotalNote        = await aztec.note.create(minteePublicKey, newMintedTotal)
  const newTotalNoteViewKey = newTotalNote.exportNote().viewingKey
  const minteeNoteViewKey   = minteeNote.exportNote().viewingKey
  LOGGER.debug(`created new minted total note with hash ${newTotalNote.noteHash}`)
  LOGGER.debug('and viewing key', newTotalNoteViewKey)

  const {
    proofData: mintProofData,
  } = aztec.proof.mint.encodeMintTransaction({
    newTotalMinted : newTotalNote,
    oldTotalMinted : oldTotalNote,
    adjustedNotes  : [minteeNote],
    senderAddress  : token.address,
  })

  // Do the minting
  LOGGER.debug('Setting proofs')
  await minedTx( token.setProofs, [1, -1] )
  LOGGER.debug('Confidentially minting ')
  const mintedTxHash = await minedTx( token.confidentialMint, [MINT_PROOF, mintProofData] )

  // Save the minted total notes
  LOGGER.debug('New minted total note hash', newTotalNote.noteHash)
  const totalNoteCreated = await bm.outputter(mintKey, Map({
    zkNoteHash : newTotalNote.noteHash,
    viewingKey : newTotalNoteViewKey
  }))
  LOGGER.debug('Total note created', totalNoteCreated)

  // Save the mintee notes
  LOGGER.debug(`New mintee note hash ${minteeNote.noteHash}`)
  LOGGER.debug('New mintee note viewing key', minteeNoteViewKey)
  const minteeNoteCreated = await bm.outputter(`${baseKey}/${minteeNote.noteHash}`, Map({
    zkNoteHash : minteeNote.noteHash,
    viewingKey : minteeNoteViewKey,
  }))
  LOGGER.debug('Mintee note created', minteeNoteCreated)
  LOGGER.info(`Successfully deposited ${minteeAmount} to mintee`)

  return Map({
    minteeNoteHash : minteeNote.noteHash,
    mintedTxHash   : mintedTxHash.transactionHash,
    mintedFromZero,
  })
}

const mintTransform = createTransformFromMap({
  func: mintFunc,
  inputTypes: Map({
    bm              : TYPES.bm,
    chainId         : TYPES.string,
    deployed        : TYPES['function'],
    minedTx         : TYPES['function'],
    deployerAddress : TYPES.ethereumAddress,
    tradeSymbol     : TYPES.string,
    minteeAddress   : TYPES.ethereumAddress,
    minteePublicKey : TYPES.aztecPublicKey,
    minteeAmount    : TYPES.bn,
    mintFromZero    : TYPES.boolean,
  }),
  outputTypes: Map({
    minteeNoteHash  : TYPES.aztecNoteHash,
    mintedTxHash    : TYPES.ethereumTxHash,
    mintedFromZero  : TYPES.boolean,
  }),
})

module.exports = {
  mintTransform,
}
