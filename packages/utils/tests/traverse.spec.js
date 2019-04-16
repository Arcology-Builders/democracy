const { setFS, setPath, traverseDirs } = require('..')

setFS(require('fs'))
setPath(require('path'))

describe('Traverse directories', () => {

  it('does not fail on a non-existent directory', () => {
    traverseDirs(['nodir'], () => { return true })
  })

})
