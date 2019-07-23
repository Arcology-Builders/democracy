'use strict'
const assert = require('chai').assert
const { Map } = require('immutable')
const { begin, end } = require('./top')
const { Logger } = require('demo-utils')
const LOGGER = new Logger('depart/shims')

const shims = {}

let forksOpen = 0
let flowsOpen = 0

// Only make the flow command available within run files
shims.flowDepart = async (name, inputState) => {
  flowsOpen += 1
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

shims.flowDone = async () => {
  if (flowsOpen <= 1) {
    await end()
    flowsOpen = 0
  } else {
    flowsOpen -= 1
  }
}

module.exports = shims
