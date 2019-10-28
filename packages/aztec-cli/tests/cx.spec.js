'use strict'
const BN = require('bn.js')
const { mint, cx, doMintAmount } = require('..')
const { getConfig } = require('demo-utils')
const { wallet } = require('demo-keys')
const { parsed } = require('dotenv').config()
const { Map, List } = require('immutable')
const chai = require('chai')
const assert = chai.assert
const expect = chai.expect
chai.use(require('chai-as-promised'))

describe('Confidential transfers', () => {

  const tradeSymbol = 'AAA'
  const DEPLOYER_ADDRESS = getConfig()['DEPLOYER_ADDRESS']
  const DEPLOYER_PASSWORD = getConfig()['DEPLOYER_PASSWORD']
  const DEPLOYER_PUBLIC_KEY = '0x04b56dcc4375e855adba8f37a2a9cce64809b3d24d1981daa7c9e3f98316676b06b27a85b889559c09ad442f2636491ceb6930589cee609258df8da29e852a1312'

  // Utility methods for minting and confidential transfers pre-populated with
  // addresses and public keys
  // TODO: Make constants, test other senders/receivers besides deployer
  
  const doCxAmount = async ({
    amount, senderNoteHash, transferAll, senderIndex,
  }) => {
    const senderAddress   = parsed[`TEST_ADDRESS_${senderIndex}`   ]
    const senderPassword  = parsed[`TEST_PASSWORD_${senderIndex}`  ]
    const senderPublicKey = parsed[`TEST_PUBLIC_KEY_${senderIndex}`]

    return await cx(Map({
      unlabeled: Map({
        tradeSymbol       : tradeSymbol,
        senderAddress,
        senderPassword,
        senderPublicKey,
        receiverAddress   : parsed['TEST_ADDRESS_1'],
        receiverPublicKey : parsed['TEST_PUBLIC_KEY_1'],
        senderNoteHash    : senderNoteHash,
        transferAmount    : new BN(amount),
        transferAll       : transferAll,
      }),
      unlockSeconds     : 200,
    }))
  }

  const validateCx = async ({
    amount, senderNoteHash, transferAll,
    senderAddress=DEPLOYER_ADDRESS,
    senderPassword=DEPLOYER_PASSWORD,
    senderPublicKey=DEPLOYER_PUBLIC_KEY,
  }) => {
    return result = await preCx(Map({
      unlabeled: Map({
        tradeSymbol       : tradeSymbol,
        senderAddress,
        senderPassword,
        senderPublicKey,
        receiverAddress   : parsed['TEST_ADDRESS_1'],
        receiverPublicKey : parsed['TEST_PUBLIC_KEY_1'],
        senderNoteHash    : senderNoteHash,
        transferAmount    : new BN(amount),
        transferAll       : transferAll,
        testValueETH      : '0.2',
      }),
    }))
  }

  it('succeed transferring whole amount after minting', async () => {

    const senderNoteHash = await doMintAmount({
      amount        : new BN(22),
      tradeSymbol   : 'AAA',
      senderIndex   : 1,
      unlockSeconds : 200,
    })
    const cxResult = await doCxAmount({ amount: 22, senderNoteHash, senderIndex: 1 })
    
    // Transferring the same note hash a second time fails
    await expect(
      doCxAmount({ amount: 22, senderNoteHash, senderIndex: 1 })
    ).to.be.rejectedWith(Error)

  })
  /*
  it('transferring zero succeeds multiple times', async () => {
    const senderNoteHash = await doMintAmount({
      amount      : new BN(0),
      tradeSymbol : 'AAA',
      senderIndex : 1
    })
    await doCxAmount({
      amount         : 0,
      senderNoteHash,
      transferAll    : true,
      senderIndex    : 1,
    })
    const senderNoteHash2 = await doMintAmount({
      amount      : new BN(0),
      tradeSymbol : 'AAA',
      senderIndex : 1
    })
    await doCxAmount({
      amount         : 0,
      senderNoteHash : senderNoteHash2,
      transferAll    : true,
      senderIndex    : 1,
    })
  })

  it('succeed transferring whole amount using transferAll', async () => {

    const senderNoteHash = await doMintAmount({
      amount: new BN(500),
      senderIndex: 1,
    })
    const cxResult = await doCxAmount({
      amount         : 0,
      senderNoteHash,
      transferAll    : true,
      senderIndex    : 1,
    })
    
    // Transferring the same note hash a second time fails
    await expect(
      doCxAmount({
        amount         : 0,
        senderNoteHash,
        transferAll    : true,
        senderIndex    : 1,
      })
    ).to.be.rejectedWith(Error)
  })

  it('succeed transferring partial amount after minting', async () => {

    const senderNoteHash = await doMintAmount({
      amount: new BN(33),
      senderIndex: 1,
    })
    const cxResult = await doCxAmount({
      amount         : 11,
      senderNoteHash,
      senderIndex    : 1,
    })
    const receiverNoteHash = result.get('receiverNoteHash')
    assert.equal( receiverNoteHash.length, 66, 'receiverNoteHash should be a 256-bit hash' )

  })

  it('fails to transfer from insufficient funds', async () => {
    const senderNoteHash = await doMintAmount({
      amount: new BN(11)
    })

    await expect(
      doCxAmount({ amount: 22, senderNoteHash })
    ).to.be.rejectedWith(Error)
  })
*/
  after(() => {
    wallet.shutdownSync()
  })

})
