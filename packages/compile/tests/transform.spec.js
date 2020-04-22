const { OrderedMap, Map } = require('immutable')
const { assert } = require('chai')

const { compileTransform } = require('..')
const { runTransforms, createTransformFromMap, TYPES } = require('demo-transform')
const { createBM } = require('demo-contract')

const t = createTransformFromMap({
  func: async ({ compile, cleanCompiles, getCompiles }) => {
    await compile('DifferentSender', 'DifferentSender.sol')
  },
  inputTypes: Map({
    compile       : TYPES['function'],
    cleanCompiles : TYPES['function'],
    getCompiles   : TYPES['function'],
  }),
  outputTypes: Map()
})

describe('Compile transform', () => {

  it('runs in a simple pipeline', async () => {
    const initialState = Map({
      bm                : await createBM({ autoConfig : true }),
      sourcePathList    : ['contracts'],
      compileFullOutput : true,
      compileFlatten    : true,
    })
    const result = await runTransforms(OrderedMap([
      ['compile', compileTransform],
      ['main'   , t],
    ]), initialState)

    const { getCompiles } = result.toJS()

    assert.equal(getCompiles().count(), 1, 'Single compile was not found.')

  })

})
