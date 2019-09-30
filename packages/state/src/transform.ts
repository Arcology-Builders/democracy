import * as Immutable from 'immutable'
import { keccak256 } from 'ethereumjs-util'
import { string } from 'prop-types';

export class Keccak256Hash extends Object {
  hashBuffer: Buffer

  public constructor(objectToHash: any) {
    super()
    this.hashBuffer = keccak256(JSON.stringify(objectToHash))
  }

  public toString = () : string => {
    return this.hashBuffer.toString('hex')
  }

}

export interface ITransform {
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
