const { List, Map } = require('immutable')
const assert = require('chai').assert
const { LIB_PATTERN } = require('..')

describe('Regex pattern tests', () => {

  const code = 'ggfd__TestDir/TestLibrary3.sol:TestLibrary___fjfdasfd'
  const code2 = require('../data/code.json').code 
  const code3 = 'ggfd__TestLibrary3.sol:TestLibrary___fjfdasfd'
  
  const badcode = 'ggfd__//TestLibrary3.sol:TestLibrary___fjfdasfd'
  const badcode2 = 'ggfd__TestLibrary3.sol:3___fjfdasfd'
  const badcode3 = 'ggfd__.sol:TestLibrary___fjfdasfd'

  it('matches valid library link patterns', () => {
    assert(code.match(LIB_PATTERN))
    assert(code2.match(LIB_PATTERN))
    assert(code3.match(LIB_PATTERN))
    LIB_PATTERN.lastIndex = 0
    const match = LIB_PATTERN.exec(code)
    assert(match, `No match for LIB_PATTERN in ${code}`)     
    assert.equal(match[0], '__TestDir/TestLibrary3.sol:TestLibrary___')
    assert.equal(match[1], 'TestDir/')
    assert.equal(match[2], 'TestLibrary3')
    assert.equal(match[3], 'TestLibrary')
    const noMatch = LIB_PATTERN.exec(code.replace(LIB_PATTERN, 'aaa'))
    assert.notOk(noMatch)
  })

  it('fails to match bad library link patterns', () => {
    assert.notOk(LIB_PATTERN.test(badcode))
    assert.notOk(LIB_PATTERN.test(badcode2))
    assert.notOk(LIB_PATTERN.test(badcode3))
  })

})
