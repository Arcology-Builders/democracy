const demo = require('..')

const { Map } = require('immutable')
const assert = require('chai').assert

val = demo.get('someSpace', 'a', "boo")

assert(isNaN(val))

val = demo.set('someSpace', 'a', new Map({'a': 1, 'b': 2}))
assert(val)

val = demo.get('someSpace', 'a')
assert.equal(val.toString(), '{"a":1,"b":2}')

val = demo.set('someSpace', 'a', null)
assert(val)
