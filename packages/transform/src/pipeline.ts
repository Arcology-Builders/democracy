import * as Immutable from 'immutable'
import { string } from 'prop-types'
import { assert } from 'chai'
import {
  Args, ArgType, ArgTypes, TYPES, checkExtractArgs
} from './types'
import {
  Transform, CallableTransform
} from './transform'
import { Keccak256Hash } from './utils'
const { Logger } = require('demo-utils')
const LOGGER = new Logger('pipeline')

export type Pipeline = PipeHead | PipeAppended

export const isSubset = (a: ArgTypes, b: ArgTypes): boolean => {
  return a.reduce((s: boolean, val: ArgType, key: string, a: ArgTypes) => {
    assert( val['typeName'], `${val} does not have typename` )
    const aTypes = Immutable.Set([val.typeName])
    const bTypes = Immutable.Set([(b.get(key) || TYPES.badType).typeName])
    return Boolean(s && (aTypes.isSubset(bTypes) || val(undefined)))
  }, true)
}

export class PipeHead {

  name? : string
  prev : Pipeline
  // PipeHead uses mergedInputTypes for the initial stage of typechecking
  mergedInputTypes : ArgTypes
  mergedOutputTypes : ArgTypes
  traverseList : Immutable.List<Pipeline>

  // A pipeline could have multiple transforms from its head
  // the newest transform (its own) is the last one added
  lastCallables: Immutable.List<CallableTransform>

  contentHash : Keccak256Hash

  cacheable : boolean

  constructor(lastCallables: Immutable.List<CallableTransform>, name?: string) {
    this.name = name
    this.lastCallables = lastCallables
    this.prev = this
    this.cacheable = lastCallables.reduce((s,v,k,a) => { return s && v.transform.cacheable }, Boolean(true))
    // More needs to be added to this later
    const hashObj = Immutable.fromJS({
      lastCallables,
    })
    this.contentHash       = new Keccak256Hash(hashObj)
    this.mergedInputTypes  = lastCallables.reduce(
      (s,v,k,a) => s.mergeDeep(v.transform.inputTypes), Immutable.Map({})
    )
    this.mergedOutputTypes = lastCallables.reduce(
      (s,v,k,a) => s.mergeDeep(v.transform.outputTypes), Immutable.Map({})
    )
    this.traverseList      = Immutable.List([this])
  }

  toString = (): string => {
    return JSON.stringify({
      lastCallables : this.lastCallables.map(x => x.transform.toString()).toJS(),
      contentHash   : this.contentHash.toString(), 
      traverseList  : this.traverseList.map(t => t.contentHash),
    })
  }

  append(newCallables: Immutable.List<CallableTransform>, name?: string) {
    const outputTypes: ArgTypes = newCallables.reduce((s,v,k,a) => s.mergeDeep(v.transform.outputTypes), Immutable.Map({}))
    const inputTypes: ArgTypes = newCallables.reduce((s,v,k,a) => s.mergeDeep(v.transform.inputTypes), Immutable.Map({}))
    assert( isSubset( inputTypes, this.mergedOutputTypes ),
      `Input types of new transform ${inputTypes.map((v,k) => v.typeName)} ` +
      `is not a subset of output types of last transform ${this.mergedOutputTypes.map((v,k) => v.typeName)}`
    )
    return new PipeAppended(newCallables, this, name)
  }
  
}

export class PipeAppended extends PipeHead {

  prev : Pipeline

  constructor(callables: Immutable.List<CallableTransform>, prev: Pipeline, name?: string) {
    super(callables, name)
    this.prev = prev
    this.traverseList = prev.traverseList.push(this)
    // This seems somewhat redundant with super class above
    const mergedOutputTypes: ArgTypes = callables.reduce(
      (s,v,k,a) => s.mergeDeep(v.transform.outputTypes), Immutable.Map({})
    )
    this.mergedOutputTypes = prev.mergedOutputTypes.mergeDeep(mergedOutputTypes)
  }
  
}

export type CallablePipeline = {
  (state: Args): Promise<Args>
  pipeline: Pipeline
}
/*
const pipelineGenerator = async function* (head: Pipeline, initialState: Args) {
  let inState = initialState
  let current = head
  do {
    let outState = await current.lastCallable(inState)
    const mergedState = inState.mergeDeep(outState)
    yield mergedState
    inState = mergedState
    current = current.next
  } while (current)
}
*/
export const createPipeline = (pipeline: Pipeline): CallablePipeline => {
  const traverseList = pipeline.traverseList  
  const callable = async (initialState: Args) => {
    let inState: Args = initialState
    for (let pipe of traverseList.toJS()) {
       const i: Number = traverseList.indexOf(pipe)
       const outState = await pipe.lastCallables.reduce(async (s: Args,v:CallableTransform,k:number,a:Immutable.List<CallableTransform>) => {
         try {
           const out = await v(inState)
           return (await s).mergeDeep(out)
         } catch(e) {
           LOGGER.error(`Transform run error in pipe ${i} named ${pipe.name}.\n`, e.message)
           throw e
         }
       }, inState) // start all siblings to merge from same state
      // then later siblings in the line override earlier sibs
       const checkedState : Args = checkExtractArgs(outState, pipe.mergedOutputTypes)
       inState = inState.mergeDeep(checkedState)
    }
    
    return inState
  }
  callable.pipeline = pipeline
  return callable
}
