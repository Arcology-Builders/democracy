const { constants, proofs } = require('@aztec/dev-utils') 
const aztec = require('aztec.js')
const dotenv = require('dotenv')
dotenv.config(); const secp256k1 = require('@aztec/secp256k1') 
const { Map } = require('immutable')
const { run, argListMixin, deployerMixin, departMixin } = require('demo-depart')
const { fromJS } = require('demo-utils')
const { wallet, isAccount } = require('demo-keys')
const assert = require('chai').assert

const m0 = argListMixin(Map({
  unlockSeconds: 100,
  testValueETH: '0.1',
  testAccountIndex: 0,
  tradeSymbol: 'KKK',
  sourcePathList: ['./node_modules/@aztec/protocol/contracts'],
}))
const m1 = deployerMixin()
const m2 = departMixin()

//const ZkAssetMintable = artifacts.require('./ZkAssetMintable.sol');

const {
  JOIN_SPLIT_PROOF,
  MINT_PROOF,
} = proofs

const mainFunc = async (state) => {
  const { bm, chainId, deployed, minedTx, LOGGER, deployerAddress, tradeSymbol } = state.toJS()
  const bobAccount = await wallet.accountsMap[deployerAddress]
  assert( isAccount(bobAccount), `Bob's account not found for address ${deployerAddress}` )
  // TODO: Add a method to add a member for publicAztecKey
  //bob.publicKey = `0x04${bob.get('publicString')}`
  const bob = secp256k1.accountFromPrivateKey(bobAccount.get('privatePrefixed'))
  const sally = secp256k1.accountFromPrivateKey(process.env.GANACHE_TESTING_ACCOUNT_1)
  let privateVenmoContract
  let joinSplitContract
  let tokenAddress
  let bobNote1
  let bobNote2

  erc20Token = await deployed( 'TestERC20', Map({}), `deploy${tradeSymbol}` )
  console.log('Token Address ', erc20Token.address)
  joinSplitInterface = await deployed( 'JoinSplitInterface' )
  joinSplitContract = await deployed( 'JoinSplit', { abi: joinSplitInterface.abi } )
  privateVenmoContract = await deployed( 'ZkAssetMintable', { deployID: `deploy${tradeSymbol}` } )
  console.log('Private Venmo Address ', privateVenmoContract.address)
  console.log('Deployer Address ', deployerAddress)

  console.log('Bob should be able to deposit 100 then pay sally 25 by splitting notes he owns')
  console.log('Bob public key', bob.publicKey)
    
  console.log('Bob wants to deposit 50')
  bobNote1 = await aztec.note.create(bob.publicKey, 50)

  const baseKey =`zkNotes/${chainId}/${bob.address}/${privateVenmoContract.address}`
  const mintKey = `zkMintedTotals/${chainId}/${bob.address}/${privateVenmoContract.address}`
  console.log(`Mint Key ${mintKey}`)

  let oldTotalNote, oldTotalNoteHash
  try { 
    oldTotalNoteRaw = await bm.inputter(mintKey)
    oldTotalNoteHash = oldTotalNoteRaw.get('zkNoteHash')
    oldTotalNoteViewingKey = oldTotalNoteRaw.get('viewingKey')
    oldTotalNote = await aztec.note.fromViewKey(oldTotalNoteViewingKey)
    console.log(`retrieved old minted total note with hash ${oldTotalNoteHash}`)
    console.log(`viewing key ${oldTotalNoteViewingKey}`)
    console.log(`k ${oldTotalNote.k}`)
  } catch(e) {
    console.error(e)
    oldTotalNote = await aztec.note.createZeroValueNote()
    console.log(`created zero old minted total note with hash ${oldTotalNote.noteHash}`)
  }

  const oldMintedTotal = Number(oldTotalNote.k)
  
  console.log(`old minted total ${oldMintedTotal}`)
 
  const newTotalNote = await aztec.note.create(bob.publicKey, oldMintedTotal + 50)
  console.log(`created new minted total note with hash ${newTotalNote.noteHash}`)
  await bm.outputter(mintKey, fromJS( newTotalNote.exportNote() ) )

  const {
    proofData: mintProofData,
  } = aztec.proof.mint.encodeMintTransaction({
    newTotalMinted: newTotalNote,
    oldTotalMinted: oldTotalNote,
    adjustedNotes: [bobNote1],
    senderAddress: privateVenmoContract.address,
  })

  // the person who validates the proof

  console.log('Setting proofs')
  await minedTx( privateVenmoContract.setProofs, [1, -1] )
  //, {from: deployerAddress});
  console.log('Confidentially minting ')
  await minedTx( privateVenmoContract.confidentialMint, [MINT_PROOF, mintProofData] )
  //, {from: deployerAddress});


  await bm.outputter(`${baseKey}/${bobNote1.noteHash}`, fromJS( bobNote1.exportNote() ))
  console.log('Bob succesffully deposited 190')

  console.log('Bob takes a taxi, Sally is the driver')
  const sallyTaxiFee = await aztec.note.create(sally.publicKey, 10)

  console.log('The fare comes to 10')
  bobNote2 = await aztec.note.create(bob.publicKey, 40)

  // Reconstruct a note from an exported viewing key
  const bobNote = await aztec.note.fromViewKey(bobNote1.exportNote().viewingKey)
  bobNote.owner = bob.address

  const argMap =  {
    inputNotes: [bobNote], // use bobNote1 for raw note, bobNote for reconstructed note
    outputNotes: [sallyTaxiFee, bobNote2],
    senderAddress: deployerAddress,
    inputNoteOwners: [bob],
    publicOwner: deployerAddress,
    kPublic: 0,
    validatorAddress: privateVenmoContract.address,
  }

  //console.log('argMap', JSON.stringify(argMap) )
  const { proofData, expectedOutput, signatures } = aztec.proof.joinSplit.encodeJoinSplitTransaction(argMap)
  console.log('Join split proof encoded')
  
  const validateResult =
    await joinSplitContract.validateJoinSplit( proofData, deployerAddress, constants.CRS )
  console.log('Validated join-split', validateResult)
  await minedTx( privateVenmoContract.confidentialTransfer, [proofData, signatures] )
  //, {
  //  from: accounts[0],
  //});
  
  console.log(
    'Bob paid sally 10 for the taxi and gets 40 back'
  )
  wallet.shutdownSync()
}

run( mainFunc, [ m0, m1, m2 ] ).then(() => { console.log('That\'s all folks') })
