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

export class Transform extends Function {
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
  __self__ : any

  constructor() {
    super('...args', 'console.log(`SELF`, this); return this.__self__.__call__(...args)')
    return this
  }

  bindSelf = (child: Transform) => {
    var self = this.bind(child)
    this.__self__ = this
    console.log(`THIS`, this.__self__)
    console.log(`CALL`, this.__call__)
  }

  __call__ = ({...args}) => {
    console.log(`FUNC`,this.func)
  //  return this.func({...args})
  }
  
  // Add a `__call__` method in subclasses
}

export type Pipeline = PipeHead | PipeAppended

export class PipeHead {

  head : Pipeline | null 
  prev : Pipeline | null
  traverseList : Immutable.List<Pipeline>

  // A pipeline could have multiple transforms from its head
  // the newest transform (its own) is the last one added
  lastTransform: Transform

  contentHash : Keccak256Hash

  cacheable : boolean

  constructor(lastTransform: Transform) {
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

  append(newTransform: Transform) {
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

  constructor(transform: Transform, prev: Pipeline) {
    super(transform)
    this.head = prev.head ? prev.head : prev
    this.prev = prev
    this.traverseList = prev.traverseList.push(prev)
  }
  
}
