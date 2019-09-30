'use strict';

import * as Immutable from "immutable"

const { ITransform, Keccak256Hash } = require('..');

class PublicKeyTransform extends ITransform {

  func(signer: string): Immutable.Map<string,string> {
    return Immutable.fromJS({
      'publicKey': 2
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
