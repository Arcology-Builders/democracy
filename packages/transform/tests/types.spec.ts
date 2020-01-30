'use strict'

import { assert } from 'chai'
import { TYPES, isHexPrefixed } from '../src/types'

describe('Democracy types', () => {

  const prefixedKeccakHash =
    '0x09a33449c7526a56e658aff99a93a4dd8bf0788aeba88ba65cd94f35e1b4af19'

  it('checks floatString type', async () => {

    const result = TYPES.floatString('0.1')
    assert.notOk(
 result['error'],
      `A float string doesn't pass with error ${result}`
    )

    const result2 = TYPES.floatString('0.x')
    assert.ok(
 result2['error'],
      'An invalid float string was not detected'
    )

  })

  it('checks hex string correctly', async () => {

    assert(TYPES.hexPrefixed(''), 'empty string should not be valid hexPrefixed')

    assert.notOk(
 TYPES.hexPrefixed('0x123')['error'],
      '0x123 should be a valid hexPrefixed'
    )
    const result = TYPES.hexPrefixed('0xZ')
    assert(
 result['error'],
      `A prefixed hex string doesn't pass with error ${result['error']}`
    )

  })

  it('checks keccak256Hash correctly', async () => {

    const result = TYPES.keccak256Hash(prefixedKeccakHash)
    assert( result['error'],
      `A prefixed keccak hash doesn't pass with error ${result}`
    )

    const result2 = TYPES.keccak256Hash(prefixedKeccakHash.slice(2))
    assert.notOk( result2['error'],
      `unprefixed keccak hash should have error but doesn't`
    )

  })

  it('checks ethereumTxHash', async () => {

    const result2 = isHexPrefixed('', 66)
    assert( result2['error'], `Empty string is not a valid hex prefixed ${result2}`)

    const result = TYPES.ethereumTxHash('')
    assert( result['error'], 'Empty string is not an ethereum txHash')

  })

  it('finds optional BN type', async () => {
    const result = TYPES.bn.opt(undefined)
    assert.notOk(
 result['error'],
      'Undefined was not accepted as an optional BN type'
    )
  })

})
