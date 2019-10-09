const { assert } = require('chai')
const {
  ArgType, TYPES, createInitialTransform, ADD_INPUT_TYPES, createAddTransform,
  PipeHead, PipeAppended, createPipeline
} = require('..')

const { Map, List } = require('immutable')

describe('Imported demo-state', () => {

  it('creates type from string', () => {
    const argType = TYPES.string
    assert.equal( argType.typeName, 'string' )
  })

  let p2

  it('appending pipeline creates it in the right order', () => {
    const transform1 = createInitialTransform(Map({}),
      Map({firstArg: TYPES.number, secondArg: TYPES.number}))
    const transform2 = createAddTransform('sum')
    const transform3 = createAddTransform('sum')
    const p1 = new PipeHead(List([transform1]))
    p2 = p1.append(List([transform2]))
    assert.equal( p2.traverseList.count(), 2)
    assert( p2.traverseList.get(0) === p1 )
    assert( p2.traverseList.get(1) === p2 )
  })

  it('creates a callable pipeline and calls it with initial args', async () => {
    const pipe = createPipeline(p2)
    const result = await pipe(Map({firstArg: 66, secondArg: 77}))
    assert.equal( result.get('sum'), 143 )
  })

})
