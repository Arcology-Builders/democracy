const demo   = require('..')
const chai   = require('chai')
const assert = chai.assert
const fs     = require('fs')
const path   = require('path')

describe('Democracy immutable key getting and setting', () => {

  it('creates a new key and verifies file exists', async () => {
    demo.set('x/y/z', '{"type": "xylophone"}')
    assert(fs.existsSync(path.join(demo.DB_DIR, 'x', 'y', 'z.json')))
    assert.equal('{"type":"xylophone"}', fs.readFileSync(path.join(demo.DB_DIR, 'x', 'y', 'z.json')).toString())
    assert('xylophone', demo.get('x/y/z'))
  })
 
 it('erases the new key', async () => {
   demo.set('x/y/z', null)
   assert.notOk(fs.existsSync(path.join(demo.DB_DIR, 'x', 'y', 'z.json')))
 })

})
