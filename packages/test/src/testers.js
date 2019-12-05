'use strict'

const { assert } = require('chai')
const { runTransforms } = require('demo-transform')
const { Logger } = require('demo-utils')

// Local module state, last stage computed
let prevStage = 0
let pipeline
const resultMap = {}
const LOGGER = new Logger('tester')
const testers = {}

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

testers.runSubIts = async (itList) => {
  //it(itList.get(0).desc, itList.get(0).func)
  return await itList.reduce((prom, {desc, func}) => {
    //const result = await prom
    
    const newProm = new Promise((resolve, reject) => {
      const wrappedFunc = async () => {
        const result = await prom
        LOGGER.info('Outgoing result', result)
        const newResult = func(result)
        LOGGER.info('Incoming result', newResult)
        resolve(newResult)
      }
      it(desc, wrappedFunc)
    })
    return newProm
  }, Promise.resolve(true))
}

module.exports = testers
