'use strict'
const assert = require('chai').assert
const { Map } = require('immutable')
const { begin, end } = require('./top')
const { Logger } = require('demo-utils')
const LOGGER = new Logger('depart/shims')

const shims = {}

let forksOpen = 0

// Only make the flow command available within run files
shims.flowDepart = async (name, inputState) => {
	
	assert(Map.isMap(inputState), 'Input state should be immutable Map')
	const outState = (await begin(inputState, false))
	return outState
}

shims.forkDepart = async (name, inputState) => {
  forksOpen += 1
	assert(Map.isMap(inputState), 'Input state should be immutable Map')
	const outState = (await begin(inputState, false))
	return outState
}

shims.forkDone = async () => {
  LOGGER.debug('forksOpen', forksOpen)
  if (forksOpen <= 1) {
    await end()
    forksOpen = 0
  } else {
    forksOpen -= 1
  }
}

/*
// TODO Have demo-test register all test files first, then
// check for all tests registering flowDone() here before calling end()
shims.flowDone = async () => {
  if (outstandingFlows == 0) {
    await end()
  }
}
*/

module.exports = shims
