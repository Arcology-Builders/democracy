import Imm from 'immutable'
import { assert } from 'chai'
import { Keccak256Hash } from './utils'
import { TYPES, Args, ArgType, ArgMapType, ArgTypes, checkExtractArgs, makeMapType } from './types'
const { fromJS, Logger } = require('demo-utils')
const LOGGER = new Logger('transform')

export type CallableTransform = {
  (state: Imm.Map<string,any>): Promise<Imm.Map<string, any>>
  transform: Transform
}

export type TransformFunc = (args: any) => Promise<Imm.Map<string,any> >

export class Transform {
  inputTypes  : ArgTypes
  outputTypes : ArgTypes
  cacheable   : boolean
  func        : TransformFunc
  lang?        : string
  compiler?    : string
  version?     : string
  contextMap?  : { [key : string] : {
    packageName: string
    packageVersion: string
  } }
  contentHash : Keccak256Hash

  constructor(
    func                 : TransformFunc ,
    inputTypes           : ArgTypes      ,
    outputTypes          : ArgTypes      ,
    cacheable?           : boolean       ,
  ) {
    this.func          = func
    this.inputTypes    = inputTypes
    this.outputTypes   = outputTypes
    const hashObj = {
      func,
      inputTypes,
      outputTypes,
    }
    this.cacheable   = cacheable || false
    this.contentHash = new Keccak256Hash(hashObj)
  }

  toString(): string {
    return 'Transform'
  }
}

export const convertMapArgs = (jsonArgs: any, types: ArgTypes) : Args => {
  return Imm.Map<string,any>(jsonArgs).map((argValue: any, argName: string) =>  {
    const argType : ArgType = types.get(argName, TYPES.any)
    const typeName : string = argType.typeName
    return argType.childTypes ? convertMapArgs(argValue, argType.childTypes) : argValue
  })
}

export const createTransform = (transform: Transform): CallableTransform => {
  const callable = async (state: Imm.Map<string,any>) => {

    let inputArgs : Args
    try {
      inputArgs = checkExtractArgs(state, transform.inputTypes)
    } catch(e) {
      throw new Error(`Input types mismatch given state ${JSON.stringify(state.toJS())} ` +
        `and inputTypes ${transform.inputTypes.toJS()}:  ${e.message}`)
    }
/*
    const tuples : [string,any][] = Imm.List(inputArgs.keys()).toJS()
      .map( (y: string) => [y, inputArgs.get(y)] )

    const firstLevel = tuples.reduce<{[key: string]: any}>(
      (s: { [key: string]: any}, x: [string,any]) => { s[x[0]] = x[1]; return s },
      {} as [string,any]
    )
*/
    const output = await transform.func(inputArgs.toJS()) 
    const convertedOutput : Args = convertMapArgs(output, transform.outputTypes) 
/*
    const outLevel = output.reduce((s: boolean, v: any, k: string) => {
      const typeName = transform.outputTypes.get(k, {typeName: ''}).typeName
      if (typeName.endsWith('MapType') && !Imm.Map.isMap(v)) {
        //console.log(k + ' was not an immutable map ' + JSON.stringify(v))
        return false
      } else {
        //console.log(k + ' had type ' + typeof(v) + ' and was of type ' + typeName)
        return true
      }
    }, true)
*/
    let outputArgs

    try {
      outputArgs = checkExtractArgs(convertedOutput, transform.outputTypes) 
    } catch(e) {
      LOGGER.error('Output types mismatch', e.message)
      throw e
    }

    return outputArgs
  }
  callable.transform = transform
  return callable
}

type InputType = {firstArg: 'number', secondArg: 'number'}

const createOutputTypes = (outLabel?: string): Imm.Map<string,any> => {
  const outMap: { [key: string]: any } = {}
  outMap[outLabel ? outLabel : 'sum'] = TYPES.number
  return Imm.Map(outMap)
}

export const createInitialTransform = (initialState: Args, types: ArgTypes): CallableTransform => {
  // Initial input func is just a dummy that returns initial state and doesn't need anything
  // from the input state
  const func = async (initialArgs: Args): Promise<Args> => {
    // Actual args override defaults
    return new Promise((resolve) => resolve(initialState.mergeDeep(initialArgs)))
  }
  return createTransform({
    func,
    inputTypes  : types,
    outputTypes : types,
    cacheable   : false,
    contentHash : new Keccak256Hash(func),
  })
}
