'use strict'
const assert     = require('chai').assert
const { keccak } = require('ethereumjs-util')
const { List, Map } = require('immutable')

const utils = require('demo-utils')

const LOGGER = new utils.Logger('Flattener')
const PATTERN = /import \"(\.\.?\/)*([A-Za-z0-9]+\/)*([A-Za-z0-9]+).sol\";/

const flattener = {}

flattener.Flattener = class {

  constructor() {
    this.sourcesToFlatten = Map({})
    this.sourcesList = List([])
  }

  addSource(sourceName, sourceString) {
    this.sourcesToFlatten = this.sourcesToFlatten.set(sourceName, sourceString)
    this.sourcesList = this.sourcesList.insert(0, sourceString)
  }

  static replaceImports(sourceString) {
    let match = sourceString.match(PATTERN)
    while (match) {
      LOGGER.debug('MATCH', match[0])
      sourceString = sourceString.replace(match[0], '')
      match = sourceString.match(PATTERN)
    }
    return sourceString
  }

  reduce() {
    return this.sourcesList.reduce((sum, source, i) =>
                                   ((i > 0) ? `${sum}\n${source}` : source), '')
  }

  flatten() {
    return flattener.Flattener.replaceImports( this.reduce() )
  }

}

module.exports = flattener
