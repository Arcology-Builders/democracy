'use strict'
const { Map, OrderedMap } = require('immutable')
const { toChecksumAddress, keccak } = require('ethereumjs-util')
const BN = require('bn.js')
const chai = require('chai')
const assert = chai.assert
chai.use(require('chai-as-promised'))
const { parsed } = require('dotenv').config()

const { padLeft } = require('web3-utils')
const { Logger } = require('demo-utils')
const { wallet } = require('demo-keys')
const { runTransforms, deployerTransform, createArgListTransform } = require('demo-transform')
const { departTransform } = require('demo-depart')
const { AZTEC_TYPES : TYPES } = require('demo-aztec-lib')

const LOGGER = new Logger('params.spec')

const m0 = createArgListTransform(Map({
  unlockSeconds       : TYPES.integer,
  testValueETH        : TYPES.string,
  testAccountIndex    : TYPES.integer,
  wallet              : TYPES.wallet,
  sourcePathList      : TYPES.array,
}))

const initialState = Map({
  unlockSeconds       : 30,
  testValueETH        : '0.1',
  testAccountIndex    : 0,
  proxyContractName   : 'SwapProxy',
  proxySwapMethodName : 'twoSidedTransfer',
  sourcePathList      : ['../../node_modules/@aztec/protocol/contracts'],
  wallet,
})

describe('Param utils ', () => {

  const earlyPipeline = OrderedMap([
    [ 'argList' , m0 ],
    [ 'deployer', deployerTransform],
    [ 'depart'  , departTransform],
  ])

  it('calls getAddress', async () => {
   
    const result = (await runTransforms( earlyPipeline, initialState )).toJS()

    const pu = await result.deployed( 'ParamUtils' )

    const address = await pu.getAddress( parsed['TEST_ADDRESS_1'], 0 )
    assert.equal( toChecksumAddress(address['0']),
      parsed['TEST_ADDRESS_1'],
      `Unpacked address does not match.`
    )
  })

  it('calls getAddress within SwapProxy', async () => {

    const result = (await runTransforms( earlyPipeline, initialState )).toJS()

    const sp = await result.deployed( 'SwapProxy' )
    const address = await sp.getAddress( parsed['TEST_ADDRESS_1'] + '1234' )
    LOGGER.info('address', address)
    const bytes32 = keccak(parsed['TEST_PUBLIC_KEY_1']).toString('hex')
    assert.equal( toChecksumAddress(address['0']),
      parsed['TEST_ADDRESS_1'],
      `Unpacked address does not match.`
    )

  })
  
  it('calls getUint256 within SwapProxy', async () => {

    const result = (await runTransforms( earlyPipeline, initialState )).toJS()

    const sp = await result.deployed( 'SwapProxy' )
    const params = padLeft(parsed['TEST_ADDRESS_3'], 64)
    LOGGER.info('params', params)
    const uint = await sp.getUint256(params)
    LOGGER.info('uint', uint)
    assert( uint['0'].eq(new BN(parsed['TEST_ADDRESS_3'].slice(2), 16)),
      `Unpacked address does not match.`
    )

  })
  
  after(() => {
    wallet.shutdownSync()
  })
  
})
