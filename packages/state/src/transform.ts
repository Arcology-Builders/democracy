import * as Immutable from 'immutable'
import { keccak256 } from 'ethereumjs-util'
import { string } from 'prop-types';

class Keccak256Hash extends Object {
  hashBuffer: Buffer

  public constructor(objectToHash: any) {
    super()
    this.hashBuffer = keccak256(JSON.stringify(objectToHash))
  }

  public toString = () : string => {
    return this.hashBuffer.toString('hex')
  }

}

interface ITransform {
  func       : (args: any[]) => Immutable.Map<string,string>
  lang       : string
  compiler   : string
  version    : string
  contextMap : { [key : string] : {
    packageName: string
    packageVersion: string
  } }
  stringify  : () => string
  contentHash: Keccak256Hash
}

const publicKeyTransform : ITransform = {
  func: (signer) => {
    return Immutable.fromJS({
      'publicKey': 2
    })
  },
  lang       : "Javascript",
  compiler   : "Node",
  version    : "v11.14.0",
  contextMap : {
    'Map': {
      'packageName'    : 'immutable',
      'packageVersion' : '14',
    },
  },
  stringify: () => {
    return JSON.stringify({
      'type'       : 'DemocracyTransform',
      'func'       : this.func,
      'lang'       : this.lang,
      'compiler'   : this.compiler,
      'version'    : this.version,
      'contextMap' : this.contextMap,
    })
  },
  contentHash: new Keccak256Hash(this.stringify())
}