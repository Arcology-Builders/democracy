'use strict'

const { assert } = require('chai')
const { List } = require('immutable')
const { ptPipeline } = require('../src/pt')
const { assembleCallablePipeline } = require('demo-transform')

describe('Private trade pipeline', () => {
  
  const pipelineList = List(ptPipeline.values())

  for (let name in ptPipeline.toJS()) {
    const i = pipelineList.indexOf(ptPipeline.get(name))
    it(`assembles to pipe #${i}: ${name}`, async () => {
      assembleCallablePipeline(pipelineList.slice(0,i+1))
    })
  }

})
