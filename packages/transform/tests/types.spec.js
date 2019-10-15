'use strict'

const { assert } = require('chai')
const { isHexPrefixed, DEMO_TYPES, subbedKey } = require('..')
const { getConfig } = require('demo-utils')
const { wallet } = require('demo-keys')
const { createBM } = require('demo-contract')

describe('Transform types', () => {

  const TEST_ADDRESS = getConfig()['DEPLOYER_ADDRESS']

  let bm
  let instance

  before(async () => {
    await wallet.init({ unlockSeconds: 10 })
    bm = await createBM({ autoConfig: true })
  })

  it('detects prefixed hex', async () => {
    assert( isHexPrefixed(TEST_ADDRESS),
           'TEST_ADDRESS is not detected as valid' )
    assert.notOk( isHexPrefixed(TEST_ADDRESS.slice(2)),
           'TEST_ADDRESS without 0x is detected as valid' )
  })

  it('detects Ethereum address', async () => {
    assert( DEMO_TYPES.ethereumAddress(TEST_ADDRESS),
           'TEST_ADDRESS is not detected as a valid Ethereum address' )
    assert.notOk( DEMO_TYPES.ethereumAddress(TEST_ADDRESS.toUpperCase()),
           'TEST_ADDRESS case converted is incorrectly detected as valid checksum address' )
  })

  it('detects Democracy wallets', async () => {
    assert( DEMO_TYPES.wallet(wallet),
           'Valid wallet is not detected as such' )
    assert.notOk( DEMO_TYPES.wallet(bm),
           'BM is detected as a valid wallet' )
  })

  it('detects Democracy builds manager', async () => {
    assert( DEMO_TYPES.bm(bm),
           'Valid builds manager is not detected as such' )
    assert.notOk( DEMO_TYPES.bm(wallet),
           'Wallet is erroneously detected as a valid builds manager' )
  })

  it('detects Democracy contract instances', async () => {
    assert( DEMO_TYPES.contractInstance(instanc3),
           'Valid builds manager is not detected as such' )
    assert.notOk( DEMO_TYPES.bm(wallet),
           'Wallet is erroneously detected as a valid builds manager' )
  })

  
})
