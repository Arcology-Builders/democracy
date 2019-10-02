'use strict';

import * as Immutable from "immutable"
import { assert } from "chai"

const { transform } = require('..')

const { Keccak256Hash } = transform

import { Transform, PipeHead } from '../src/transform'

class PublicKeyTransform extends Transform {

  inputTypes = Immutable.fromJS({
    'signer': 'string'
  })
  outputTypes = Immutable.fromJS({
    'publicKey': 'number'
  })

  cacheable = true

  func = ({signer}: {signer: string}): Immutable.Map<string,string> => {
    return Immutable.fromJS({
      'publicKey': signer.length
    })
  }

  lang = "Javascript"
  compiler = "Node"
  version = "v11.14.0"
  contextMap = {
    'Map': {
      'packageName'    : 'immutable',
      'packageVersion' : '14',
    },
  }

  constructor(...args) {
    super()
    this.bindSelf(this)
  }

  __call__ = ({signer}:{signer: string}) => {
    return this.func({signer})
  }

  stringify = (): string => {
    return JSON.stringify({
      'type'       : 'DemocracyTransform',
      'func'       : this.func,
      'lang'       : this.lang,
      'compiler'   : this.compiler,
      'version'    : this.version,
      'contextMap' : this.contextMap,
    })
  }

  contentHash = new Keccak256Hash(this.stringify())
}

describe('Cached states', () => {
    it('creates a transform', async () => {
      const x: Transform = new PublicKeyTransform()
      const result = x({ signer: 'some starry night'})
      assert.equal(result, 17)
      const p = new PipeHead(x)
    });
});
