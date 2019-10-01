'use strict';

import * as Immutable from "immutable"

const { transform } = require('..')

const { Keccak256Hash } = transform

import { ITransform } from '../src/transform'

class PublicKeyTransform implements ITransform {

  inputTypes = Immutable.fromJS({
    'signer': 'string'
  })
  outputTypes = Immutable.fromJS({
    'publicKey': 'number'
  })

  cacheable = true

  func({signer: string}): Immutable.Map<string,string> {
    return Immutable.fromJS({
      'publicKey': '2'
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

  stringify(): string {
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
    //const x: ITransform = new PublicKeyTransform() 
    });
});
