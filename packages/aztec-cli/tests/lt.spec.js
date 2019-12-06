// Unit test for linked trade pipeline
'use strict'
const { mint, lt, ltPipeline, ltInitialState, doPt } = require('..')
const { getConfig, Logger } = require('demo-utils')
const { wallet } = require('demo-keys')
const { partialPipeline, runSubIts, setInitialState } = require('demo-tests')
const { Map, List } = require('immutable')
const { toChecksumAddress } = require('ethereumjs-util')
const { padLeft } = require('web3-utils')
const { abiEncoder : { outputCoder } } = require('aztec.js')
const { proofs : { JOIN_SPLIT_PROOF } } = require('@aztec/dev-utils')
const randombytes = require('randombytes')
const BN = require('bn.js')
const chai = require('chai')
const assert = chai.assert
const expect = chai.expect
chai.use(require('chai-as-promised'))
const { parsed } = require('dotenv').config()

const LOGGER = new Logger('lt.spec')

const fuzz = (hexPrefixed, amount) => {
  const hexString = hexPrefixed.slice(2)
  const randomIndex = Math.round(Math.random() * (hexString.length - amount))
  const randomFuzz = randombytes(amount).toString('hex').slice(0,amount)
  return '0x' + hexString.slice(0,randomIndex)
    + randomFuzz + hexString.slice(randomIndex+amount,hexString.length)
}

describe('Linked trade', () => {

  let sellerProofOutput
  let bidderProofOutput

  const SELLER_TRADE_SYMBOL = 'AAA'
  const BIDDER_TRADE_SYMBOL  = 'BBB'

  const asyncIts = [{
    desc: 'empty test',
    func: async () => {
      assert( true, 'intentional success' )
    },
  }, {
    desc: 'beforeAll',
    func: async () => {
      const sellerResult = await mint(Map({
        tradeSymbol     : SELLER_TRADE_SYMBOL,
        minteeAddress   : parsed['TEST_ADDRESS_1'],
        minteePublicKey : parsed['TEST_PUBLIC_KEY_1'],
        minteeAmount    : new BN(22),
        unlockSeconds   : 200,
        testAccountIndex : 1,
      }))
      const sellerNoteHash = sellerResult.get('minteeNoteHash')

      const bidderResult = await mint(Map({
        tradeSymbol     : BIDDER_TRADE_SYMBOL,
        minteeAddress   : parsed['TEST_ADDRESS_2'],
        minteePublicKey : parsed['TEST_PUBLIC_KEY_2'],
        minteeAmount    : new BN(22),
        unlockSeconds   : 200,
        testAccountIndex : 1,
      }))
      const bidderNoteHash = bidderResult.get('minteeNoteHash')

      const initialState = ltInitialState.merge(Map({
        seller: Map({
          tradeSymbol : SELLER_TRADE_SYMBOL        ,
          address     : parsed['TEST_ADDRESS_1']   ,
          password    : parsed['TEST_PASSWORD_1']  ,
          publicKey   : parsed['TEST_PUBLIC_KEY_1'],
          noteHash    : sellerNoteHash             ,
        }),
        bidder : Map({
          tradeSymbol : BIDDER_TRADE_SYMBOL        ,
          address     : parsed['TEST_ADDRESS_2']   ,
          password    : parsed['TEST_PASSWORD_2']  ,
          publicKey   : parsed['TEST_PUBLIC_KEY_2'],
          noteHash    : bidderNoteHash             ,
        }),
        testAccountIndex: 1,
      }))
      setInitialState( initialState, ltPipeline )
    },
  }, {
    desc: 'EIP712 signing',
    func: async () => {
      const result = (await partialPipeline(11)).toJS()
      
			assert.equal( result.sigR.length, 64, `${result.sigR} not a 32-byte hash` )
			assert.equal( result.sigS.length, 64, `${result.sigS} not a 32-byte hash` )
			assert( result.sigV, `${result.sigV} not a non-zero uint8 constant` )
			
			LOGGER.info('EIP712 Result',
				result.bidder,
				result.seller,
				result.saleExpireBlockNumber,
				result.bidExpireBlockNumber,
				result.sigR,
				result.sigS,
				result.sigV,
			)

      // Check basic EIP712 parameters

      const chainId = await result.validator.chainId()
			assert.equal( parseInt(result.chainId, 10), parseInt(chainId['0'], 10), `Mismatched chainId` )
			const salt = await result.validator.SALT()
			assert.equal( result.DOMAIN_SALT, salt['0'].slice(2), `Mismatched salt` )
			const domain = await result.validator.EIP712_DOMAIN()
			const domainTypeHash = await result.validator.EIP712_DOMAIN_TYPEHASH()
			const domainSeparator = await result.validator.getDomainSeparator()
			const tradeTypeHash = await result.validator.TRADE_TYPEHASH()
			LOGGER.info('Encoded Typed Data ', JSON.stringify(result.encodedTypedData))
			LOGGER.info('Chain ID ', JSON.stringify(chainId))
			LOGGER.info('EIP712 SALT', JSON.stringify(salt))
			LOGGER.info('EIP712 DOMAIN', JSON.stringify(domain))
			LOGGER.info('EIP712 DOMAIN TYPEHASH', JSON.stringify(domainTypeHash))
			assert.equal( result.DOMAIN_TYPEHASH, domainTypeHash['0'].slice(2), `Mismatched DOMAIN_TYPEHASH` )
			LOGGER.info('EIP712 DOMAIN SEPARATOR', JSON.stringify(domainSeparator))
			assert.equal( result.domainSeparator, domainSeparator['0'].slice(2), `Mismatched domainSeparator` )
			LOGGER.info('EIP712 TRADE TYPEHASH', JSON.stringify(tradeTypeHash))
			assert.equal( result.TRADE_TYPEHASH, tradeTypeHash['0'].slice(2), `Mismatched bid typehash` )
      
      assert( result.transfererAddress, `Transferer address missing.` )
/*
      const sellerNotes = await result.validator.getNotes(result.seller.jsProofData)
      LOGGER.info('Seller Notes ', sellerNotes)
*/
      assert( result.minedTx, `MinedTx method missing from result` )
      const sellerValidation = await result.minedTx(
        result.validator.validateAndGetFirstProofOutput,
        [result.seller.jsProofData, result.transfererAddress] )
      LOGGER.info('Seller Validate & Proof Outputs', sellerValidation)
      const sellerGasUsed = new BN(sellerValidation.gasUsed, 16).toNumber()
      assert( sellerGasUsed > 796000 && sellerGasUsed < 800000, `sellerGasUsed between 796,000 and 800,000` )
      // We expect about 700,000 gas for a join-split involving 2-3 three notes (sender, receiver, change)

      const bidderValidation = await result.minedTx( result.validator.validateAndGetFirstProofOutput, [result.bidder.jsProofData, result.bidder.transfererAddress] )
      LOGGER.info('Bidder Validate & Proof Outputs', bidderValidation)
      const bidderGasUsed = new BN(bidderValidation.gasUsed, 16).toNumber()
      assert( bidderGasUsed > 796000 && bidderGasUsed < 800000, `bidderGasUsed between 796,000 and 800,000` )
      // Likewise for bidder side, we expect about 700,000 gas for a join-split involving 2-3 three notes (sender, receiver, change)

      //const validateAndProofOutputs = await result.minedTx( result.validator.extractProofOutput, [result.seller.jsProofData, result.seller.transfererAddress] )
      //LOGGER.info('ValidateAndProofOutputs', validateAndProofOutputs)
      sellerProofOutput = outputCoder.getProofOutput(result.seller.jsProofOutput, 0)
      const sellerFormattedProofOutput =  '0x' + sellerProofOutput.slice(0x40)
      //assert.equal( parseInt(sellerProofOutput.slice(0, 0x40), 16), 0,
      //  `Sliced prefix sellerProofOutput was not all zeroes` )
      const recoveredSellerProofHash
        = await result.validator.hashValidatedProof(
          sellerFormattedProofOutput,
        );
      const sellerProofHash = outputCoder.hashProofOutput(sellerProofOutput);

      assert.equal( recoveredSellerProofHash['0'], sellerProofHash,
        `seller proof hash doesn't match` )

      bidderProofOutput = outputCoder.getProofOutput(result.bidder.jsProofOutput, 0);
      //assert.equal( parseInt(bidderProofOutput.slice(0, 0x40), 16), 0,
      //  `Sliced prefix bidderProofOutput was not all zeroes` )
      const bidderFormattedProofOutput =  '0x' + bidderProofOutput.slice(0x40)
      const bidderProofHash   = outputCoder.hashProofOutput(bidderProofOutput);
      
      const validateResult = await result.ace.validateProofByHash(
        JOIN_SPLIT_PROOF, sellerProofHash, result.seller.transfererAddress,
      )
      assert.ok( Boolean(validateResult['0']), `seller proof hash should be valid` )

      const validateResult2 = await result.ace.validateProofByHash(
        JOIN_SPLIT_PROOF, sellerProofHash, result.seller.zkToken.address,
      )
      assert.notOk( Boolean(validateResult2['0']),
        `seller proof hash associated with transferer/sender, not token address`
      )

      const sellerProofComponents = await result.validator.extractProofOutput(
        sellerFormattedProofOutput
      )
      LOGGER.info('Seller Proof Components', sellerProofComponents)
      
      const formattedInputNotes  = `0x${sellerProofComponents['_inputNotes'].slice(0x40)}`
      const formattedOutputNotes = `0x${sellerProofComponents['_outputNotes'].slice(0x40)}`
      const inputLength          = await result.validator.getLength(
        sellerProofComponents['_inputNotes']
      )
      const outputLength         = await result.validator.getLength(
        sellerProofComponents['_outputNotes']
      )
      LOGGER.info('Seller Notes Length', inputLength, outputLength)

      assert.equal( inputLength['0'].toNumber(), 1,
        `Number of seller input notes is not 1` )
      assert.equal( outputLength['0'].toNumber(), 2,
        `Number of bidder output  notes is not 2` )

      const sellerProofParams = [
        '0x' + sellerProofOutput,
        result.seller.transfererAddress,
      ]
      LOGGER.info('Seller Params', sellerProofParams)
      const sellerNoteHashes = await result.validator.extractAndVerifyNoteHashes(
        ...sellerProofParams
      )

      assert.equal( sellerNoteHashes['0'], result.seller.jsSenderNote.noteHash,
        `seller input note hash doesn't match`
      )
      assert.equal( sellerNoteHashes['1'], result.seller.jsReceiverNote.noteHash,
        `bidder output note hash doesn't match`
      )
      
      //const sellerNoteHashValidation = await result.minedTx(
      //  result.validator.extractAndVerifyNoteHashes, sellerParams
      //)
      // We expect this to be much less than 700,000 gas, since we already validated and cached the above proofs above
      //LOGGER.info('Seller Note Hash Validation', sellerNoteHashValidation)
      
      const randomHash = randombytes(32).toString('hex')

      expect(
        result.minedTx( result.validator.extractAndVerifyNoteHashes, [
          // should be jsProofOutput
          result.seller.jsProofData, // this might run out of gas
          result.seller.transfererAddress,
          randomHash,
        ] )
      ).to.be.rejectedWith(Error)

      // Re-enable if extractAndVerifyNoteHashes changes from view to default
      // and we save lastProofOutput instead of passing it in
      //const recoveredSellerProofOutput = await result.validator.lastProofOutput()
      //assert.equal( sellerProofOutput.slice(0x40), recoveredSellerProofOutput['0'].slice(2),
      //  `Seller proofOutput doesn't match` )

      const bidderProofParams = [
        '0x' + bidderProofOutput,
        result.bidder.transfererAddress,
      ]
      LOGGER.info('Bidder Params', bidderProofParams)
      const bidderNoteHashes = await result.validator.extractAndVerifyNoteHashes(
        ...bidderProofParams
      )
      //  , {from: getConfig()['DEPLOYER_ADDRESS'], gas: getConfig()['GAS_LIMIT'] } )
      // We expect this to be much less than 700,000 gas, since we already validated and cached the above proofs above
      LOGGER.info('Bidder Note Hashes', bidderNoteHashes)

      assert.equal( bidderNoteHashes['0'], result.bidder.jsSenderNote.noteHash,
        `bidder input note hash doesn't match`
      )
      assert.equal( bidderNoteHashes['1'], result.bidder.jsReceiverNote.noteHash,
        `seller output note hash doesn't match`
      )

      return {
        sellerProofOutput,
        bidderProofOutput,
      }
    }
  }, {
    desc: 'extractAllNoteHashes',
    func: async ({ sellerProofOutput, bidderProofOutput }) => {
      
      const result = (await partialPipeline(11)).toJS()

      const noteHashes = await result.validator.extractAllNoteHashes(
        '0x' + sellerProofOutput,
        '0x' + bidderProofOutput,
        result.seller.transfererAddress,
      )
      assert.equal( noteHashes['0'], result.seller.jsSenderNote.noteHash,
        `seller input note hash doesn't match`
      )
      assert.equal( noteHashes['1'], result.seller.jsReceiverNote.noteHash,
        `bidder output note hash doesn't match`
      )
      assert.equal( noteHashes['2'], result.bidder.jsSenderNote.noteHash,
        `bidder input note hash doesn't match`
      )
      assert.equal( noteHashes['3'], result.bidder.jsReceiverNote.noteHash,
        `seller output note hash doesn't match`
      )
      return {
        sellerProofOutput,
        bidderProofOutput,
      }
    }
  }, {
    desc: 'parameter encodings',
    func: async () => {
      LOGGER.info('parameter encodings')

      const result = (await partialPipeline(11)).toJS()

      const sellerParams = [
        result.seller.address,
        result.seller.zkToken.address,
        padLeft('0x' + result.saleExpireBlockNumber.toString('hex'), 64),
        result.seller.transfererAddress,
      ].reduce((s,v) => s + (v.startsWith('0x') ? v.slice(2) : v), '0x' )
      LOGGER.info('Seller Params', sellerParams)

		  const bidderParams = [
        result.bidder.address,
        result.bidder.zkToken.address,
        padLeft('0x' + result.bidExpireBlockNumber.toString('hex'), 64),
        result.sigR,
        result.sigS,
        '0x' + Number(result.sigV).toString(16),
      ].reduce((s,v) => s + (v.startsWith('0x') ? v.slice(2) : v), '0x' )
      LOGGER.info('Bidder Params', bidderParams)

      const sigR = await result.paramUtils.getBytes32(bidderParams, 72)
      LOGGER.info('sigR', sigR)
      assert.equal( sigR['0'], '0x' + result.sigR,
        'sigR mismatched'
      )

      const sigS = await result.paramUtils.getBytes32(bidderParams, 104)
      LOGGER.info('sigS', sigS)
      assert.equal( sigS['0'], '0x' + result.sigS,
        'sigS mismatched'
      )

      const sigV = await result.paramUtils.getUint8(bidderParams, 136)
      LOGGER.info('sigV', sigV)
      assert.equal( sigV['0'], result.sigV,
        'sigV mismatched'
      )

      const sigVIndex = 136*2
      const sigV2 = parseInt(bidderParams.slice(2).slice(sigVIndex, sigVIndex+2), 16)
      LOGGER.info('sigV', sigV2)
      assert.equal( sigV2, result.sigV,
        'sigV mismatched'
      )

      const transfererAddress = await result.paramUtils.getAddress(sellerParams, 72)
      LOGGER.info('transfererAddress', transfererAddress)
      assert.equal( toChecksumAddress(transfererAddress['0']), result.seller.transfererAddress,
        'transferer address mismatched'
      )
      const sellerAddress = await result.paramUtils.getAddress(sellerParams, 0)
      LOGGER.info('sellerAddress', sellerAddress)
      assert.equal( toChecksumAddress(sellerAddress['0']), result.seller.address,
        'seller address mismatched'
      )
      const bidderAddress = await result.paramUtils.getAddress(bidderParams, 0)
      LOGGER.info('bidderAddress', bidderAddress)
      assert.equal( toChecksumAddress(bidderAddress['0']), result.bidder.address,
        'bidder address mismatched'
      )

      const sellerTokenAddress = await result.paramUtils.getAddress(sellerParams, 20)
      LOGGER.info('sellerTokenAddress', sellerTokenAddress)
      assert.equal( toChecksumAddress(sellerTokenAddress['0']), result.seller.zkToken.address,
        'seller token address mismatched'
      )
      const bidderTokenAddress = await result.paramUtils.getAddress(bidderParams, 20)
      LOGGER.info('bidderTokenAddress', bidderTokenAddress)
      assert.equal( toChecksumAddress(bidderTokenAddress['0']), result.bidder.zkToken.address,
        'bidder token address mismatched'
      )

      const saleExpireBlockNumber = await result.paramUtils.getUint256(sellerParams, 72)
      assert.equal(
        saleExpireBlockNumber['0'].toNumber(), result.saleExpireBlockNumber.toNumber(),
        'Sale expire block number mismatched'
      )
      
      const saleExpireBlockNumber2 = await result.paramUtils.getUint256(sellerParams, 73)
      assert.notEqual(
        saleExpireBlockNumber2['0'].toNumber(), result.saleExpireBlockNumber.toNumber(),
        'Incorrect offset for sale expire block number matched anyway'
      )
      
      const bidExpireBlockNumber = await result.paramUtils.getUint256(bidderParams, 72)
      assert.equal(
        bidExpireBlockNumber['0'].toNumber(), result.bidExpireBlockNumber.toNumber(),
        'Bid expire block number mismatched'
      )

      return {
        sellerParams,
        bidderParams,
      }
    },
  }, {
    desc: 'hashMessage and hashTrade',
    func: async ({ sellerParams, bidderParams }) => {

      const result = (await partialPipeline(11)).toJS()

			const hashMessageArgs = [
        sellerParams,
        bidderParams,
				result.seller.jsSenderNote.noteHash,
				result.seller.jsReceiverNote.noteHash,
				result.bidder.jsSenderNote.noteHash,
				result.bidder.jsReceiverNote.noteHash,
			]

			LOGGER.info('hashMessage args', hashMessageArgs)

			const messageHash = await result.validator.hashMessage(...hashMessageArgs)
			assert.equal( result.messageHash, messageHash['0'].slice(2), `Mismatched messageHash` )
			const finalHash = await result.validator.hashTrade( ...hashMessageArgs )
			assert.equal( result.finalHash, finalHash['0'].slice(2), `Mismatched finalHash` )

      const recoveredAddress = await result.validator.recoverAddress(
        finalHash['0'],
        '0x'+result.sigR,
        '0x'+result.sigS,
        '0x'+Number(result.sigV).toString(16),
      );
      assert.equal( toChecksumAddress( recoveredAddress['0'] ), result.bidder.address,
        `recovered address mismatched` )

      return {
        sellerParams,
        bidderParams,
      }
    },
  }, {
    desc: 'ltPrepareTransform swapMethodParams',
    func: async({ sellerParams, bidderParams }) => {

      const result = (await partialPipeline(12)).toJS()

      LOGGER.info('seller swapMethodParams', result.seller.swapMethodParams)
      const sellerEncodedParams = List(result.seller.swapMethodParams)
        .reduce((s, v) => s + ((v.startsWith('0x')) ? v.slice(2) : v), '0x' )
      LOGGER.info('sellerEncodedParams', sellerEncodedParams)
      LOGGER.info('bidder swapMethodParams', result.bidder.swapMethodParams)
      const bidderEncodedParams = List(result.bidder.swapMethodParams)
        .reduce((s, v) => s + ((v.startsWith('0x')) ? v.slice(2) : v), '0x' )
      LOGGER.info('bidderEncodedParams', bidderEncodedParams)
      assert.equal( sellerParams, sellerEncodedParams,
                `encoded seller params did not match` )
      assert.equal( bidderParams, bidderEncodedParams,
                `encoded bidder params did not match` )

      return {
        sellerEncodedParams,
        bidderEncodedParams,
      }
    },
  }, {
    desc: 'extractAndHash',
    func: async ({ sellerEncodedParams, bidderEncodedParams }) => {
      
      const result = (await partialPipeline(11)).toJS()

      LOGGER.info( 'Encoded Params', sellerEncodedParams, bidderEncodedParams )
      LOGGER.info( 'Proof Output', sellerProofOutput, bidderProofOutput )
      const hash = await result.validator.extractAndHash(
        sellerEncodedParams,
        bidderEncodedParams,
        '0x' + sellerProofOutput,
        '0x' + bidderProofOutput,
      )
      
      assert.equal( hash['0'], '0x' + result.messageHash, 'message hash mismatch' )
      return {
        sellerEncodedParams,
        bidderEncodedParams,
      }

    }
  }, {
    desc: 'extractAndRecover',
    func: async ({ sellerEncodedParams, bidderEncodedParams }) => {
      const result = (await partialPipeline(11)).toJS()

      const recoveredAddress = await result.validator.extractAndRecover(
        sellerEncodedParams,
        bidderEncodedParams,
        '0x' + sellerProofOutput,
        '0x' + bidderProofOutput,
      )
      LOGGER.info('extractAndRecover', sellerEncodedParams, bidderEncodedParams,
        sellerProofOutput, bidderProofOutput
      )
      assert.equal( toChecksumAddress(recoveredAddress['0']), result.bidder.address,
        'invalid trade proof from params' )

      const recoveredAddress2 = await result.validator.extractAndRecover(
        fuzz(sellerEncodedParams, 7),
        fuzz(bidderEncodedParams, 7),
        '0x' + sellerProofOutput,
        '0x' + bidderProofOutput,
      )
      assert.notEqual( recoveredAddress2['0'], result.bidder.address,
        'invalid trade proof from params' )

      const isValid = await result.validator.verifyTrade( 
        sellerEncodedParams,
        bidderEncodedParams,
        '0x' + sellerProofOutput,
        '0x' + bidderProofOutput,
      )
      assert( Boolean(isValid['0']), 'valid trade not verified' )

      const isValid2 = await result.validator.verifyTrade( 
        fuzz(sellerEncodedParams, 14),
        fuzz(bidderEncodedParams, 14),
        '0x' + sellerProofOutput,
        '0x' + bidderProofOutput,
      )
      assert.notOk( Boolean(isValid2['0']), 'invalid trade was verified' )
/*

			const isValid = await result.proxy.verifySignature(
				result.bidder.address,
				//result.seller.address,
				result.bidder.zkToken.address,
				result.seller.zkToken.address,
				//result.bidder.noteHash,
				result.seller.noteHash,
				//result.saleExpireTime,
				//result.bidExpireTime,
				result.bidder.jsProofData,
				'0x' + result.sigR,
				'0x' + result.sigS,
				result.sigV,
			)
			assert( isValid['0'], `Signature is not valid from ${result.bidder.address}` )
	*/	
    },
  }]

  runSubIts(List(asyncIts))
  /*
  it( asyncIts[1].desc, asyncIts[1].func )
  it('super it', async () => {
  })
 */ 
  after(() => {
    wallet.shutdownSync()
  })
  
})
