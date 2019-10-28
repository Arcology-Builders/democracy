const { mint, pt, cheatPt, doPt } = require('..')
const { getConfig } = require('demo-utils')
const { wallet } = require('demo-keys')
const { Map } = require('immutable')
const BN = require('bn.js')
const chai = require('chai')
const assert = chai.assert
const expect = chai.expect
chai.use(require('chai-as-promised'))
const { parsed } = require('dotenv').config()

describe('Private trade', () => {

  const SELLER_TRADE_SYMBOL = 'AAA'
  const BIDDER_TRADE_SYMBOL  = 'BBB'

  // Utility methods for minting and confidential transfers pre-populated with
  // addresses and public keys
  // TODO: Make constants, test other senders/receivers besides deployer
  
  it('succeeds in minting and private trade', async () => {
    
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

    const result = await doPt({ sellerNoteHash, bidderNoteHash })
    assert(result.get('ptTxHash'))

    // Trying to atomic swap a second time should fail
    expect(
      doPt({ sellerNoteHash, bidderNoteHash })
    ).to.be.rejectedWith(Error)
  })
  
  after(() => {
    wallet.shutdownSync()
  })
  
})
