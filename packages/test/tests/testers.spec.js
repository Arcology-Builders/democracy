'use strict'
const { runSubIts } = require('..')
const { assert } = require('chai')

describe('Testers', () => {

  const asyncIts = [
    {
      desc: 'func1',
      func: async () => {
        assert(true)
      },
    }, {
      desc: 'func2',
      func: async () => {
        assert(true)
      },
    }
  ]

  runSubIts(asyncIts)

})
