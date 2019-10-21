import Imm from 'immutable'
import { assert } from 'chai'
import { Keccak256Hash } from './utils'
import { TYPES, Args, ArgTypes, checkExtractArgs } from './types'

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
    func: TransformFunc, inputTypes: ArgTypes, outputTypes: ArgTypes, cacheable? : boolean
  ) {
    this.func        = func
    this.inputTypes  = inputTypes
    this.outputTypes = outputTypes
    const hashObj = {
      func,
      inputTypes,
      outputTypes
    }
    this.cacheable   = cacheable || false
    this.contentHash = new Keccak256Hash(hashObj)
  }

  toString(): string {
    return 'Transform'
  }
}

export const createTransform = (transform: Transform): CallableTransform => {
  const callable = async (state: Imm.Map<string,any>) => {
    const inputArgs = checkExtractArgs(state, transform.inputTypes)
    const output = await transform.func(inputArgs.toJS())
    const outputArgs = checkExtractArgs(output, transform.outputTypes) 
    return output
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

export const ADD_INPUT_TYPES: ArgTypes = Imm.Map({firstArg: TYPES.number, secondArg: TYPES.number})
export const createAddTransform = (outLabel?: string): CallableTransform => {
  const func = async ({firstArg, secondArg}: InputType): Promise<Args> => {
    const outMap: { [key: string]: any } = {}
    outMap[outLabel ? outLabel : 'sum'] = Number(firstArg) + Number(secondArg)
    return new Promise((resolve) => {
      setTimeout(() => resolve(Imm.Map(outMap)), 500)
    })
  }
  return createTransform({
    func,
    inputTypes  : ADD_INPUT_TYPES,
    outputTypes : createOutputTypes(outLabel),
    cacheable   : false,
    contentHash : new Keccak256Hash(func),
  })
}
