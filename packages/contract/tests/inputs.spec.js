const { fromJS } = require('demo-utils')
const { getInputsToBuild } = require('../src/utils')
const { Map } = require('immutable')
const assert = require('chai').assert

describe( 'inputs to build', () => {

  it( 'requested input built from scratch (new key)', () => {
    const requestedInputs = fromJS({
      'a': {'c': 1},
      'b': {
        'd': 2,
      }
    })
    const existingOutputs = fromJS({'b': {'d': 2,
      'inputHash': '910759a5392490adace169cc77c9989f9fc524439e85004a93a544fde9463b62'}})
    const expected = '{"a":{"c":1,"isUpdated":false,"isNew":true}}'
    const inputs = getInputsToBuild(requestedInputs, existingOutputs)
    assert.equal(JSON.stringify(inputs.toJS()), expected)
   // '{"a":{"c":1,"isUpdated":false,"isNew":true}}')
  })

  it( 'requested input has changed (existing key)', () => {
    const requestedInputs = fromJS({
      'a': {'c': 1},
      'b': {
        'd': 3,
      }
    })
    const existingOutputs = fromJS({
      'a': {'c' : 1,
        'inputHash': 'dea49041d0207dac39b4d1223b951b2585865f74e54c7a3ccef3eabc87527b88'
      },
      'b': {'d': 2,
      'inputHash': '910759a5392490adace169cc77c9989f9fc524439e85004a93a544fde9463b62'}
    })
    const expected = '{"b":{"d":3,"isUpdated":true,"isNew":false}}'
    const inputs = getInputsToBuild(requestedInputs, existingOutputs)
    assert.equal(JSON.stringify(inputs.toJS()), expected)
  })

})
