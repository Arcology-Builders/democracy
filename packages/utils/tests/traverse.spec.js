const { traverseDirs } = require('..')

describe('Traverse directories', () => {

  it('does not fail on a non-existent directory', () => {
    traverseDirs(['nodir'], () => { return true })
  })

})
