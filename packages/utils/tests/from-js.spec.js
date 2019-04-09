const { List, Map } 
             = require('immutable')
const chai   = require('chai')
const assert = chai.assert
const { fromJS, toJS }
             = require('..')

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
      Map({
        'bug': 'bear',
        'a'  : List(
          [
            'tiara', 
             Map({ 'b': 2 })
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
})
