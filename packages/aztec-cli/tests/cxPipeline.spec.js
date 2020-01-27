'use strict'

const { assert } = require('chai')
const { List } = require('immutable')
const { constructCxPipeline } = require('demo-aztec-lib')
const { assembleCallablePipeline } = require('demo-transform')

describe('Confidential transfer pipeline', () => {

  const pipeline = constructCxPipeline()
  const pipelineList = List(pipeline.values())

  for (let name in pipeline.toJS()) {
    const i = pipelineList.indexOf(pipeline.get(name))
    it(`assembles to pipe #${i}: ${name}`, async () => {
      assert.equal( pipelineList.get(i).transform.toString(), 'Transform' )
      assembleCallablePipeline(pipelineList.slice(0,i+1))
    })
  }

})
