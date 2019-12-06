const { mint, pt, cheatPt, doPt } = require('..')
const { getConfig, Logger } = require('demo-utils')
const { wallet } = require('demo-keys')
const { Map } = require('immutable')
const BN = require('bn.js')
const chai = require('chai')
const assert = chai.assert
const expect = chai.expect
chai.use(require('chai-as-promised'))
const { parsed } = require('dotenv').config()

const LOGGER = new Logger('pt.spec')

describe('Private trade', () => {

  const SELLER_TRADE_SYMBOL = 'AAA'
  const BIDDER_TRADE_SYMBOL  = 'BBB'

  // Utility methods for minting and confidential transfers pre-populated with
  // addresses and public keys
  // TODO: Make constants, test other senders/receivers besides deployer
  
  it('succeeds in minting and private trade', async () => {
    
    const sellerResult = await mint(Map({
      tradeSymbol      : SELLER_TRADE_SYMBOL,
      minteeAddress    : parsed['TEST_ADDRESS_1'],
      minteePublicKey  : parsed['TEST_PUBLIC_KEY_1'],
      minteeAmount     : new BN(22),
      unlockSeconds    : 200,
      testAccountIndex : 3,
    }))
    const sellerNoteHash = sellerResult.get('minteeNoteHash')

    const bidderResult = await mint(Map({
      tradeSymbol      : BIDDER_TRADE_SYMBOL,
      minteeAddress    : parsed['TEST_ADDRESS_2'],
      minteePublicKey  : parsed['TEST_PUBLIC_KEY_2'],
      minteeAmount     : new BN(22),
      unlockSeconds    : 200,
      testAccountIndex : 3,
    }))
    const bidderNoteHash = bidderResult.get('minteeNoteHash')

    const result = (await doPt({ sellerNoteHash, bidderNoteHash })).toJS()
    assert(result.ptTxHash)

    const minedTx = result.minedTx

    const params = [result.seller.jsProofData, result.seller.transfererAddress]
    LOGGER.info( 'getNotes Params ', ...params )
    const sellerNotes = await minedTx( result.proxy.getNotes, params )
    LOGGER.info('sellerNotes', sellerNotes)

    LOGGER.info('sourcePathList', result.sourcePathList)
    assert.equal( result.sourcePathList.length, 3,
      `Source path list has wrong length.` )
    LOGGER.info('seller swapMethodParams', result.seller.swapMethodParams)
    assert.equal( result.seller.swapMethodParams.length, 2,
      `Swap method params has wrong length. Check pipeline.ts using mergeNonList` )
    LOGGER.info('bidder swapMethodParams', result.bidder.swapMethodParams)
    assert.equal( result.bidder.swapMethodParams.length, 2,
      `Swap method params has wrong length. Check pipeline.ts using mergeNonList` )

    // Trying to atomic swap a second time should fail
    expect(
      doPt({ sellerNoteHash, bidderNoteHash })
    ).to.be.rejectedWith(Error)
  })
  
  after(() => {
    wallet.shutdownSync()
  })
  
})
