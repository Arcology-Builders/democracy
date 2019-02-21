// WORK-IN-PROGRESS
// Cosult notebook on 18 Feb 2019 for more details
const assert = require('chai').assert

const get = require('./get')
const set = require('./set')

bind = (alias, cmds, boundParamMap, freeParamMap) => {
  assert.typeOf(alias, "string")
  assert(alias)
  assert(cmds.count() > 0)

  const cmdArgList = cmds.map((cmd) => {
    const cmdArg = get(cmd)
    assert(cmdArg, `${cmd} should have non-null value`)
    return cmdArg
  })

  if (boundParamMap) {
    const boundParamList = boundParams.reduce((set, bp, i) => {
      const tokens = bp.split('p')
      assert(tokens.count() === 2)
      const cmdNum = Number(tokens[0])
      const paramNum = Number(tokens[1])

      
    assert(cmdArg, `${cmd} should have non-null value`)
    return cmdArg
  })


}

module.exports = bind
