'use strict'

const { assert } = require('chai')
const { runTransforms } = require('demo-transform')
const testers = {}

// Local module state, last stage computed
let prevStage = 0
let pipeline
const resultMap = {}

testers.partialPipeline = async (latestStage) => {
  assert(latestStage <= pipeline.count(),
          `Latest stage ${latestStage} is greater than ${pipeline.count()}`)
  if ( latestStage > prevStage) {
    const subPipeline = pipeline.slice(prevStage, latestStage)
    const result = await runTransforms( subPipeline, resultMap[prevStage] )
    resultMap[latestStage] = result
    prevStage = latestStage
    return result
  } else {
    return resultMap[latestStage]
  }
}

testers.setInitialState = (initialState, _pipeline) => {
  resultMap[0] = initialState
  pipeline = _pipeline
}

testers.runSubIts = (itList) => {
  it(itList[0].desc, itList[0].func)
  return itList.reduce(async (prom, {desc, func}) => {
    await prom
    //console.log(desc)
    it(desc, func)
    return prom 
  }, Promise.resolve(true))
}

module.exports = testers
