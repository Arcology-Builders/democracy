const { mint } = require('../src/mint')
const { Map }  = require('immutable')
const BN       = require('bn.js')
const chai     = require('chai')
const assert   = chai.assert
const expect   = chai.expect
chai.use(require('chai-as-promised'))

const { wallet } = require('demo-keys')

describe('Minting tests', () => {

  const tradeSymbol = 'AAA'

  it('succeeds', async () => {

    const result = await mint(Map({
      tradeSymbol     : tradeSymbol,
      minteeAddress   : '0x1051Cd3F5D5f3E097713265732A10677C043CcEA',
      minteePublicKey : '0x04b56dcc4375e855adba8f37a2a9cce64809b3d24d1981daa7c9e3f98316676b06b27a85b889559c09ad442f2636491ceb6930589cee609258df8da29e852a1312',
      minteeAmount    : new BN(22),
    }))

    assert.equal( result.get('minteeNoteHash').length, 66, 'minteeHashNote should be a SHA3 hash')

    const result2 = await mint(Map({
      tradeSymbol     : tradeSymbol,
      minteeAddress   : '0x1051Cd3F5D5f3E097713265732A10677C043CcEA',
      minteePublicKey : '0x04b56dcc4375e855adba8f37a2a9cce64809b3d24d1981daa7c9e3f98316676b06b27a85b889559c09ad442f2636491ceb6930589cee609258df8da29e852a1312',
      minteeAmount    : new BN(22),
    }))

  })

  it('fails to mint from zero', async () => {
    // Mint something first, since this runs async in parallel with above
    const result3 = await mint(Map({
      tradeSymbol     : tradeSymbol,
      minteeAddress   : '0x1051Cd3F5D5f3E097713265732A10677C043CcEA',
      minteePublicKey : '0x04b56dcc4375e855adba8f37a2a9cce64809b3d24d1981daa7c9e3f98316676b06b27a85b889559c09ad442f2636491ceb6930589cee609258df8da29e852a1312',
      minteeAmount    : new BN(22),
    }))

    expect (
      mint(Map({
        tradeSymbol     : tradeSymbol,
        minteeAddress   : '0x1051Cd3F5D5f3E097713265732A10677C043CcEA',
        minteePublicKey : '0x04b56dcc4375e855adba8f37a2a9cce64809b3d24d1981daa7c9e3f98316676b06b27a85b889559c09ad442f2636491ceb6930589cee609258df8da29e852a1312',
        minteeAmount    : new BN(33),
        mintFromZero    : true,
      }))
    ).to.be.rejectedWith(Error)

  })
  
  after(() => {
    wallet.shutdownSync()
  })

})
