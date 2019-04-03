const { List, Map } = require('immutable')
const assert = require('chai').assert
const expect = require('chai').expect
const should = require('chai').should()
const { traverseDirs, buildFromDirs, DB_DIR,
        setImmutableKey, getImmutableKey } = require('..')
const path = require('path')
const fs = require('fs')

describe('Database tests for key/value store', () => {

  before(() => {
    if (fs.existsSync('db')) {
      traverseDirs(['db'], () => {return false},
                   (source, fn) => { console.log(fn); fs.unlinkSync(fn) })
      const dirs = []
      traverseDirs(['db'], () => {return false},
                   (source, fn) => { }, (dir) => { console.log(`Dir ${dir}`); dirs.push(dir) })
      List(dirs.reverse()).map((dir) => { fs.rmdirSync(dir) })
    }
  })

  it('gets a non-existent key which should be null', () => {
    assert(isNaN(getImmutableKey('someSpace/a', "boo")))
  })

  it('creates a new sub-key', () => {
    assert(setImmutableKey('someSpace/a', new Map({'a': 1, 'b': 2})),
           "Cannot set a new value from Map" )
    assert.equal(JSON.stringify(getImmutableKey('someSpace/a').toJS()), '{"a":1,"b":2}')
  })

  it('deletes a subkey by moving it to the side', () => {
    assert(setImmutableKey('someSpace/a', null), 'Deleting an existing key should succeed')
    assert.notOk(fs.existsSync(`${DB_DIR}/someSpace/a.json`), 'JSON file should not exist.')
  })

  it('sets hierarchical keys', () => {
    assert(setImmutableKey('someSpace/b', new Map({"d":3})))
    assert(setImmutableKey('someSpace/c', new Map({"e":4})))

    newMap = buildFromDirs('db/someSpace', (fnParts) => {
      return (fnParts.length > 1 && (fnParts[1] !== 'json' || fnParts.length == 3))})
    assert.equal(JSON.stringify(newMap.toJS()), '{"b":{"d":3},"c":{"e":4}}')
  })

  it('cannot overwrite an existing key by accident', () => {
    should.Throw(() => { setImmutableKey('someSpace', new Map({"c":3})) }, Error)
  })

  it('can overwrite a key explicitly', () => {
    setImmutableKey('someSpace/b', new Map({"c":3}), true)
  })

  it('overwrites a directory with a null', () => {
    // such as happens when cleaning compile keys
    assert.ok(fs.lstatSync('db/someSpace').isDirectory())
    setImmutableKey('someSpace', null)
    assert.notOk(fs.existsSync('db/someSpace'))
    assert.notOk(fs.existsSync('db/someSpace.json'))
  })

})
