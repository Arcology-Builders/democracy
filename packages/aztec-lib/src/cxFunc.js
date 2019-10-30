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
const { createTransformFromMap, makeMapType } = require('demo-transform')
const { checkPublicKey, AZTEC_TYPES: TYPES, exportAztecPrivateNote } = require('./utils')

const LOGGER    = new Logger('cxFunc')

const cxFuncs = {}

cxFuncs.cxJsContractTransform = createTransformFromMap({
  func: async ({ deployed }) => {
    const joinSplitInterface = await deployed( 'JoinSplitInterface' )
    const joinSplitContract  = await deployed( 'JoinSplit', { abi: joinSplitInterface.abi } )
    return Map({
      joinSplitContract
    })
  },
  inputTypes: Map({
    deployed: TYPES['function'],
  }),
  outputTypes: Map({
    joinSplitContract: TYPES.contractInstance,
  }),
})

cxFuncs.createCxTokenContractsTransform = (subStateLabel='unlabeled') => {

  return createTransformFromMap({
    func: async ({ deployed, [subStateLabel]: { tradeSymbol } }) => {

      const erc20Token = await deployed( 'TestERC20',
        {deployID: `deploy${tradeSymbol}` } )
      const zkToken    = await deployed( 'ZkAssetMintable',
        { deployID: `deploy${tradeSymbol}` } )
      LOGGER.debug('ZkAsset Address ', zkToken.address)

      return Map({
        [subStateLabel]: {
					erc20Token,
					zkToken,
          zkTokenAddress: zkToken.address,
        }
      })
    },
    inputTypes : Map({
      deployed : TYPES['function'],
      [subStateLabel]: makeMapType(Map({
        tradeSymbol : TYPES.string,
      }), 'cxTokenContractsInputsMapType'),
    }),
    outputTypes : Map({
      [subStateLabel]: makeMapType(Map({
        erc20Token     : TYPES.contractInstance,
        zkToken        : TYPES.contractInstance,
        zkTokenAddress : TYPES.ethereumAddress,
      }), 'cxTokenContractsOutputsMapType'),
    }),
  })
}

cxFuncs.createCxPrepareTransform = (subStateLabel='unlabeled') => {
  
  // Parameters for an AZTEC participant
  const subStateInputTypes = Map({
    senderAddress      : TYPES.ethereumAddress,
    senderPublicKey    : TYPES.aztecPublicKey,
    senderPassword     : TYPES.string,
    senderNoteHash     : TYPES.aztecNoteHash,
    zkTokenAddress     : TYPES.ethereumAddress,
    receiverAddress    : TYPES.ethereumAddress,
    receiverPublicKey  : TYPES.aztecPublicKey,
    transfererAddress  : TYPES.ethereumAddress,
    transferAmount     : TYPES.bn.opt,
    transferAll        : TYPES.boolean.opt,
  })
 
  const commonTypes = Map({
    bm                : TYPES.bm,
    wallet            : TYPES.wallet,
    chainId           : TYPES.string,
    deployed          : TYPES['function'],
    minedTx           : TYPES['function'],
    deployerAddress   : TYPES.ethereumAddress,
    joinSplitContract : TYPES.contractInstance,
  })

  const inputTypes = Map({
    [subStateLabel]: makeMapType(subStateInputTypes, 'cxPrepareInputsMapType')
  }).merge(commonTypes)

  const subStateOutputTypes = Map({
    jsProofData     : TYPES.string,
    jsSignatures    : TYPES.string,
    jsSenderKey     : TYPES.string,
    jsSenderNote    : TYPES.aztecPrivateNote,
    jsChangeKey     : TYPES.string,
    jsChangeNote    : TYPES.aztecPrivateNote,
    jsReceiverKey   : TYPES.string,
    jsReceiverNote  : TYPES.aztecPrivateNote,
    jsTransferValue : TYPES.bn,
  })

  const outputTypes = Map({
    [subStateLabel]: makeMapType(subStateOutputTypes, 'cxPrepareOutputsMapType')
  })

  const func = async ({ 
    bm,
    wallet,
    chainId,
    deployed,
    minedTx,
    deployerAddress,
    joinSplitContract,
    [subStateLabel]: {
      senderAddress,
      senderPublicKey,
      senderPassword,
      senderNoteHash,
      zkTokenAddress,
      receiverAddress,
      receiverPublicKey,
      transfererAddress,
      transferAmount,
      transferAll,
    },
  }) => {

    // VALIDATE INCOMING PARAMETERS

    // Validate that public keys match addresses
    checkPublicKey({ aztecPublicKey: receiverPublicKey, address: receiverAddress })
    checkPublicKey({ aztecPublicKey: senderPublicKey  , address: senderAddress })

    const senderAccount = wallet.getAccountSync(senderAddress)
    const privatePrefixed = Map.isMap(senderAccount) ?
      senderAccount.get('privatePrefixed') : senderAccount.privatePrefixed
    const sender        = secp256k1.accountFromPrivateKey(privatePrefixed)
    
    assert( transferAmount || transferAll,
      `Either transferAmount or transferAll must be specified`
    )

    LOGGER.debug('Transfer Amount', transferAmount)
    LOGGER.debug('Transfer All'   , transferAll)
    LOGGER.debug('SUBSTATE'   , subStateLabel)

    const buildWriteKey = ({ ownerAddress, noteHash }) => {
      return `zkNotes/${chainId}/${ownerAddress}/${zkTokenAddress}/${noteHash}`
    }
    
    const buildReadKey = ({ ownerAddress, noteHash }) => {
      return `zkNotes/${chainId}/${ownerAddress}/${zkTokenAddress}/${noteHash}`
    }
   
    // Sending information
    const senderKey = buildReadKey({
      ownerAddress : senderAddress,
      noteHash     : senderNoteHash,
    })
    const senderNoteRaw   = await bm.inputter(senderKey)
    const senderNote      = await aztec.note.fromViewKey(senderNoteRaw.get('viewingKey'))
    senderNote.owner      = senderAddress
    const senderNoteValue = new BN(parseInt(senderNote.k))
    LOGGER.debug('Sender URL'       , senderKey)
    LOGGER.debug('Sender Note Value', senderNoteValue.toNumber())
    LOGGER.debug('Sender Address'   , senderAddress)

    let transferValue
    if (transferAll) {
      transferValue = senderNoteValue
    } else if (Number.isInteger(parseInt(transferAmount))) {
      transferValue = new BN(transferAmount)
    } else {
      throw new Error(`Invalid transfer amount ${transferAmount}`) 
    }

    assert( transferValue.lte(senderNoteValue),
      `Insufficient funds to transfer ${transferAmount} from ${senderNoteValue.toNumber()}` )

    // Change, if any, to refund back to sender
    const changeValue     = new BN(senderNoteValue).sub(new BN(transferValue))
    const changeNote      = await aztec.note.create(senderPublicKey, changeValue )
    const changeKey       = buildWriteKey({
      ownerAddress : senderAddress,
      noteHash     : changeNote.noteHash
    })
    LOGGER.debug('Change Key'       , changeKey)
    LOGGER.debug('Change Note Value', changeValue.toNumber())
    LOGGER.debug('Change Note Hash' , changeNote.noteHash)

    // Receiving information
    const receiverNote = await aztec.note.create(receiverPublicKey, transferValue)
    const receiverKey  = buildWriteKey({
      ownerAddress : receiverAddress,
      noteHash     : receiverNote.noteHash
    })
    LOGGER.debug('Receiver Key'       , receiverKey)
    LOGGER.debug('Receiver Public Key', receiverPublicKey)
    LOGGER.debug('Receiver Value'     , transferValue.toNumber())
    LOGGER.debug('Receiver Note Hash' , receiverNote.noteHash)
    //assert.equal( receiverNote.noteHash, receiverNoteCreated.get('zkNoteHash') )

    const argMap =  {
      inputNotes       : [senderNote],
      outputNotes      : [receiverNote, changeNote],
      senderAddress    : transfererAddress,
      inputNoteOwners  : [sender],
      publicOwner      : deployerAddress,
      kPublic          : 0,
      validatorAddress : zkTokenAddress,
    }

    LOGGER.debug('Join Split argMap', argMap )
    const { proofData, expectedOutput, signatures }
      = aztec.proof.joinSplit.encodeJoinSplitTransaction(argMap)
    LOGGER.debug('Join split proof encoded')
    
    const validateResult = await
    joinSplitContract.validateJoinSplit(proofData, transfererAddress, constants.CRS)
    assert.notEqual(validateResult['0'], '0x',
      'Invalid join split. Did you deploy all the contracts?')
    LOGGER.info('Validated join-split.', validateResult)
    LOGGER.info('Signatures', signatures)
    const subStateMap = Map({
      jsProofData     : proofData,
      jsSignatures    : signatures,
      jsSenderKey     : senderKey,
      jsSenderNote    : await exportAztecPrivateNote(senderNote),
      jsChangeKey     : changeKey,
      jsChangeNote    : await exportAztecPrivateNote(changeNote),
      jsReceiverKey   : receiverKey,
      jsReceiverNote  : await exportAztecPrivateNote(receiverNote),
      jsTransferValue : transferValue,
    })
    // The output subState can potentially be extended an input subState
    return Map({[subStateLabel] : subStateMap })
  }
  
  return createTransformFromMap({
    func,
    inputTypes,
    outputTypes,
  })
}

cxFuncs.createCxTransferTransform = (subStateLabel='unlabeled') => createTransformFromMap({
  func: async ({
    [subStateLabel] : {
      transferFunc,
      zkToken,
      jsProofData,
      jsSignatures
    }
  }) => {
    let txHash = await transferFunc(zkToken, jsProofData, jsSignatures)
    LOGGER.debug('Mined tx hash', txHash)
  },
  inputTypes: Map({
    [subStateLabel]: makeMapType(Map({
      transferFunc: TYPES['function'],
      zkToken      : TYPES.contractInstance,
      jsProofData  : TYPES.string,
      jsSignatures : TYPES.string,
    }), 'cxTransferInputsMapType'),
  }),
  outputTypes: Map({}),
})

cxFuncs.createCxFinishTransform = (subStateLabel='unlabeled') => createTransformFromMap({
	func: async ({
		bm,
		[subStateLabel] : {
			jsChangeKey     ,
			jsChangeNote    ,
			jsReceiverKey   ,
			jsReceiverNote  ,
			jsTransferValue ,
		},
	}) => {

		const changeNoteCreated = await bm.outputter(jsChangeKey, Map({
			zkNoteHash: jsChangeNote.noteHash,
			viewingKey: jsChangeNote.viewingKey,
		}))
		assert.equal( jsChangeNote.noteHash, JSON.parse( changeNoteCreated ).zkNoteHash )
		LOGGER.debug('Change Note Created', changeNoteCreated)

		const receiverNoteCreated = await bm.outputter(jsReceiverKey, Map({
			zkNoteHash: jsReceiverNote.noteHash,
			viewingKey: jsReceiverNote.viewingKey
		}))
		assert.equal( jsReceiverNote.noteHash, JSON.parse( receiverNoteCreated ).zkNoteHash )
		LOGGER.debug('Receiver Note Created', receiverNoteCreated)

		LOGGER.info(`Confidential transfer of ${jsTransferValue} completed.`)
		return Map({
      [subStateLabel] : Map({ 
        receiverNoteHash : jsReceiverNote.noteHash,
        changeNoteHash   : jsChangeNote.noteHash,
      }),
		})
	},
	inputTypes: Map({
		bm                : TYPES.bm,
		[subStateLabel]: makeMapType(Map({
			jsChangeKey     : TYPES.string,
			jsChangeNote    : TYPES.aztecPrivateNote,
			jsReceiverKey   : TYPES.string,
			jsReceiverNote  : TYPES.aztecPrivateNote,
			jsTransferValue : TYPES.bn,
		}), 'cxFinishInputsMapType'),
	}),
	outputTypes: Map({
		[subStateLabel]: makeMapType(Map({
			receiverNoteHash : TYPES.aztecNoteHash,
			changeNoteHash   : TYPES.aztecNoteHash,
		}), 'cxFinishOutputsMapType'),
	}),
})

module.exports = cxFuncs
