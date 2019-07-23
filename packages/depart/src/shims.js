const assert = require('chai').assert
const { Map } = require('immutable')
const { begin, end } = require('./top')

const shims = {}

// Only make the flow command available within run files
shims.flowDepart = async (name, inputState) => {
	
	assert(Map.isMap(inputState), 'Input state should be immutable Map')
	const outState = (await begin(inputState, false))
	return outState
}

shims.forkDepart = async (name, inputState) => {

	assert(Map.isMap(inputState), 'Input state should be immutable Map')
	const outState = (await begin(inputState, false))
	return outState
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
