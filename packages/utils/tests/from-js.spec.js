const { List, Map, OrderedMap, Set } 
             = require('immutable')
const chai   = require('chai')
const assert = chai.assert
const { fromJS, toJS, mergeNonLists, Logger }
             = require('..')

const LOGGER = new Logger('from-js')

describe('from JS nested values', () => {

  it('should convert a deeply nested JS object to an Immutable object', () => {
    const x = [
      {'bug': 'bear',
        'a'  : [ 'tiara', {'b': 2 } ]
      },
      [1,2,3]
    ]

    const imm = fromJS(x)
    assert(imm.equals(List([
      OrderedMap({
        'bug': 'bear',
        'a'  : List(
          [
            'tiara', 
            OrderedMap({ 'b': 2 })
          ])
      }),
      List([ 1, 2, 3 ])
    ])))
  })

  it( 'converts a nested Immutable obj to JS', () => {
    const m = Map({
      'abi': List([
        Map({'constant': true,
          'inputs': List([]),
          'stateMutability': 'view',
        })
      ])
    })
    const s = JSON.stringify(toJS(m))
    const expected = '{"abi":[{"constant":true,"inputs":[],"stateMutability":"view"}]}' 
    assert.equal(s, expected)
    const s2 = m.toJS()
    assert.notEqual(s2, expected)
  })

  it( 'merges non-lists and maps deeply', () => {
    const a = OrderedMap({
      'a': 1,
      'b': List([5,6,7]),
      'c': OrderedMap({
        'd': 2,
        'e': OrderedMap({
          'f': List([1,2,3]),
          'g': 3,
        }),
      }),
    })
    const b = OrderedMap({
      'b': List([7,8,9]),
      'c': OrderedMap({
        'd': 3,
        'e': OrderedMap({
          'h': 7,
        }),
      }),
    })

    const aKeys = Set(a.keys()) 
    const bKeys = Set(b.keys()) 
    const commonKeys = aKeys.intersect(bKeys)

    assert( aKeys.equals(Set(['a', 'b', 'c'])), `aKeys not expected` )
    assert( bKeys.equals(Set(['b', 'c'])), `bKeys not expected` )
    assert( commonKeys.equals(Set(['b', 'c'])), `commonKeys not expected` )
    assert( aKeys.subtract(commonKeys).equals(Set(['a'])), `aKeys minus commonKeys not expected` )
    assert( bKeys.subtract(commonKeys).equals(Set([])), `bKeys minus commonKeys not expected` )

    const mergedMap0 = mergeNonLists(a,Map({}))
    LOGGER.debug('mergedMap0', mergedMap0)
    assert( mergedMap0.equals(a), 'merged with empty map is not expected' )

    const mergedMap = mergeNonLists(a,b)

    LOGGER.debug('mergedMap', mergedMap)
    
    // Merged maps have common keys first, then a only keys, then b only keys
    const expectedMap = OrderedMap({
      'b': List([7,8,9]),
      'c': OrderedMap({
        'd': 3,
        'e': OrderedMap({
          'f': List([1,2,3]),
          'g': 3,
          'h': 7,
        }),
      }),
      'a': 1,
    })
    LOGGER.debug('expectedMap', expectedMap)

    assert( mergedMap.equals(expectedMap), 'merged non-list map not expected' )
  })

})
