import * as Immutable from 'immutable'
import { keccak256 } from 'ethereumjs-util'
import { string } from 'prop-types'
import { assert } from 'chai'

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
  inputTypes  : Immutable.List<[string,string]>
  outputTypes : Immutable.List<[string,string]>
  cacheable   : boolean
  func        : ({ ...args }) => Immutable.Map<string,string>
  lang        : string
  compiler    : string
  version     : string
  contextMap  : { [key : string] : {
    packageName: string
    packageVersion: string
  } }
  toString    : () => string
  contentHash : Keccak256Hash
}

export type Pipeline = PipeHead | PipeAppended

export class PipeHead {

  head : Pipeline | null 
  prev : Pipeline | null
  traverseList : Immutable.List<Pipeline>

  // A pipeline could have multiple transforms from its head
  // the newest transform (its own) is the last one added
  lastTransform: ITransform

  contentHash : Keccak256Hash

  cacheable : boolean

  constructor(lastTransform: ITransform) {
    this.lastTransform = lastTransform
    this.head = null
    this.contentHash = new Keccak256Hash(this.lastTransform.toString())
    this.traverseList = Immutable.List()
  }

  toString = (): string => {
    return JSON.stringify({
      head: this.head ? this.head.contentHash : null,
      lastTransform: this.lastTransform.toString(),
      contentHash: this.contentHash, 
      traverseList: this.traverseList.map(t => t.contentHash),
    })
  }

  append(newTransform: ITransform) {
    if (this.prev) {
      assert( this.prev.lastTransform.outputTypes.isSubset(newTransform.inputTypes),
        `Input types of new transform ${newTransform.inputTypes.toString()}` +
        `is not a subset of output types of last transform ${this.prev.lastTransform.outputTypes}`)
    }
    return new PipeAppended(newTransform, this)
  }
  
}

export class PipeAppended extends PipeHead {

  head : Pipeline
  prev : Pipeline

  constructor(transform: ITransform, prev: Pipeline) {
    super(transform)
    this.head = prev.head ? prev.head : prev
    this.prev = prev
    this.traverseList = prev.traverseList.push(prev)
  }
  
}
