// Unit test for linked trade pipeline
'use strict'
const { mint, lt, ltPipeline, ltInitialState, doPt } = require('..')
const { getConfig, Logger } = require('demo-utils')
const { wallet } = require('demo-keys')
const { partialPipeline, runSubIts, setInitialState } = require('demo-tests')
const { Map, List } = require('immutable')
const { padLeft } = require('web3-utils')
const BN = require('bn.js')
const chai = require('chai')
const assert = chai.assert
const expect = chai.expect
chai.use(require('chai-as-promised'))
const { parsed } = require('dotenv').config()

const LOGGER = new Logger('lt.spec')

describe('Linked trade', () => {

  const SELLER_TRADE_SYMBOL = 'AAA'
  const BIDDER_TRADE_SYMBOL  = 'BBB'

  // Utility methods for minting and confidential transfers pre-populated with
  // addresses and public keys
  // TODO: Make constants, test other senders/receivers besides deployer
  
  before(async () => {
    
    const sellerResult = await mint(Map({
      tradeSymbol     : SELLER_TRADE_SYMBOL,
      minteeAddress   : parsed['TEST_ADDRESS_1'],
      minteePublicKey : parsed['TEST_PUBLIC_KEY_1'],
      minteeAmount    : new BN(22),
      unlockSeconds   : 200,
    }))
    const sellerNoteHash = sellerResult.get('minteeNoteHash')

    const bidderResult = await mint(Map({
      tradeSymbol     : BIDDER_TRADE_SYMBOL,
      minteeAddress   : parsed['TEST_ADDRESS_2'],
      minteePublicKey : parsed['TEST_PUBLIC_KEY_2'],
      minteeAmount    : new BN(22),
      unlockSeconds   : 200,
    }))
    const bidderNoteHash = bidderResult.get('minteeNoteHash')

    const initialState = ltInitialState.merge(Map({
      seller: Map({
        tradeSymbol       : SELLER_TRADE_SYMBOL,
        address     : parsed['TEST_ADDRESS_1']      ,
        password    : parsed['TEST_PASSWORD_1']     ,
        publicKey   : parsed['TEST_PUBLIC_KEY_1']    ,
        noteHash    : sellerNoteHash     ,
      }),
      bidder : Map({
        tradeSymbol       : BIDDER_TRADE_SYMBOL ,
        address     : parsed['TEST_ADDRESS_2']      ,
        password    : parsed['TEST_PASSWORD_2']    ,
        publicKey   : parsed['TEST_PUBLIC_KEY_2']    ,
        noteHash    : bidderNoteHash     ,
      }),
    }))
    setInitialState( initialState, ltPipeline )
    /*

    const result = await doPt({ sellerNoteHash, bidderNoteHash, _pt: lt })
    assert(result.get('ptTxHash'))

    // Trying to atomic swap a second time should fail
    expect(
      doPt({ sellerNoteHash, bidderNoteHash })
    ).to.be.rejectedWith(Error)
  */
  })

  const asyncIts = [{
    desc: 'EIP712 signing',
    func: async() => {
      const result = (await partialPipeline(10)).toJS()
      
			assert.equal( result.sigR.length, 64, `${result.sigR} not a 32-byte hash` )
			assert.equal( result.sigS.length, 64, `${result.sigS} not a 32-byte hash` )
			assert( result.sigV, `${result.sigV} not a non-zero uint8 constant` )
			
			LOGGER.info('EIP712 Result',
				result.bidder,
				result.seller,
				result.saleExpireTime,
				result.bidExpireTime,
				result.sigR,
				result.sigS,
				result.sigV,
			)
			
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
      
      const proofParams = [ result.seller.jsProofData, result.bidder.jsProofData ]
      LOGGER.info('Proof Params', proofParams)

      const sellerNotes = await result.validator.getNotes(result.seller.jsProofData)
      LOGGER.info('Seller Notes ', sellerNotes)

      const noteHashes = await result.validator.extractAndVerifyNoteHashes( ...proofParams, {from: getConfig()['DEPLOYER_ADDRESS'], gas: getConfig()['GAS_LIMIT'] } )
      LOGGER.info('noteHashes', noteHashes)
		
      assert( noteHashes['0'], `bidderInputNoteHash null` )
      assert( noteHashes['1'], `sellerOnputNoteHash null` )
      assert( noteHashes['2'], `sellerInputNoteHash null` )
      assert( noteHashes['3'], `bidderOutputNoteHash null` )
      assert.equal( noteHashes['0'], result.bidder.jsSenderNote.noteHash, `bidderInputNoteHash mismatch` )
      assert.equal( noteHashes['1'], result.bidder.jsReceiverNote.noteHash, `sellerOnputNoteHash mismatch` )
      assert.equal( noteHashes['2'], result.seller.jsSenderNote.noteHash, `sellerInputNoteHash mismatch` )
      assert.equal( noteHashes['3'], result.seller.jsReceiverNote.noteHash, `bidderOutputNoteHash mismatch` )

			const hashMessageArgs = [
				[ result.bidder.address, result.bidder.zkToken.address, padLeft('0x' + Number(result.bidExpireBlockNumber).toString(16), 64) ]
          .reduce((s,v) => s + (v.startsWith('0x') ? v.slice(2) : v), '0x' ),
				[ result.seller.address, result.seller.zkToken.address, padLeft('0x' + Number(result.saleExpireBlockNumber).toString(16), 64) ]
          .reduce((s,v) => s + (v.startsWith('0x') ? v.slice(2) : v), '0x' ),
				result.bidder.jsSenderNote.noteHash,
				result.bidder.jsReceiverNote.noteHash,
				result.seller.jsSenderNote.noteHash,
				result.seller.jsReceiverNote.noteHash,
			]

			LOGGER.info('hashMessage args', hashMessageArgs)

			const messageHash = await result.validator.hashMessage(...hashMessageArgs)
			assert.equal( result.messageHash, messageHash['0'].slice(2), `Mismatched messageHash` )

			const finalHash = await result.validator.hashTrade( ...hashMessageArgs )
			assert.equal( result.finalHash, finalHash['0'].slice(2), `Mismatched finalHash` )

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
		
		}
  }]

  it('super it', async () => {
    await asyncIts[0].func()
    //await List(asyncIts).reduce((s, t) => s.then(async () => await it(t.desc, t.func)), Promise.resolve(true))
  })
  
  after(() => {
    wallet.shutdownSync()
  })
  
})
