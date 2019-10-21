import Immutable from 'immutable'
import { assert } from 'chai'
import { Keccak256Hash } from './utils'

export enum ArgTypeEnum {
  STRING  = 'string',
  NUMBER  = 'number',
  BOOLEAN = 'boolean',
  MAP     = 'ImmutableMap',
  LIST    = 'ImmutableList',
}

// These don't ever need to be exported
export type ArgCheckerFunc = (arg: any) => Boolean
type ArgCheckerBase = {
  (arg: any): Boolean
  typeName: string
  opt: any
}
type ArgCheckerOptional = {
  (arg: any): Boolean
  typeName: string
  opt: ArgCheckerBase
}
type ArgChecker = ArgCheckerBase | ArgCheckerOptional

/*
type ArgCheckers = {
  checkers: Immutable.List<ArgChecker>
  typeName: string
}
*/
// TODO When you're ready, uncomment the above and change below to | ArgCheckers
export type ArgType = ArgChecker

export type Args     = Immutable.Map<string,any>
export type ArgTypes = Immutable.Map<string,ArgType>

export const makeRequired = (checkerFunc: ArgCheckerFunc, typeName: string) => {
  const callable: any = checkerFunc
  callable.typeName = typeName
  return callable
}

export const makeOptional = (checkerFunc: ArgCheckerFunc, typeName: string) => {
  const callable = (obj: any) => ((obj === undefined) || checkerFunc(obj))
  callable.typeName =  typeName + '?'
  return callable
}

// Standard arg types / checkers
const BASE_TYPES: Immutable.Map<string,ArgCheckerFunc> = Immutable.Map({
  'string' : (arg: any) => (typeof(arg) === 'string'),
  'number' : (arg: any) => (typeof(arg) === 'number'),
  'boolean': (arg: any) => (typeof(arg) === 'boolean'),
  'map'    : (arg: any) => (Immutable.Map.isMap(arg)),
  'list'   : (arg: any) => (Immutable.List.isList(arg)),
  'badType': (arg: any) => false,
  'any'    : (arg: any) => true,
  'integer': (arg: any) => Number.isInteger(arg),
  'float'  : (arg: any) => typeof(parseFloat(arg)) === 'number',
})

export const TYPES_MAP: Immutable.Map<string,ArgChecker> = BASE_TYPES.map(
  (checker: ArgCheckerFunc, typeName: string): ArgChecker => {
    const requiredChecker = makeRequired(checker, typeName)
    requiredChecker.opt = makeOptional(checker, typeName)
    return requiredChecker
  }
)

export const TYPES: { [key: string] : ArgChecker } = TYPES_MAP.toJSON()
/*
export const TYPE = (typeString : string): ArgCheckers =>
  Immutable.List(typeString.split('|').map(t => (TYPES[t] || TYPES.badType)))
const argCheckerSafe = (argType: string): ArgChecker => {
    const argChecker = argCheckerMap[argType]
    if (argChecker != undefined) { return argChecker }
    else { return () => false }
}
*/
//const argCheckers: ArgCheckers = Immutable.Map(argCheckerMap)

export const checkExtractArgs = (args: Immutable.Map<string,any>, argTypes: ArgTypes) => {
  return argTypes.map((argType: ArgType, argName: string) => {
    const argCheckers = Immutable.List([argType])
    const arg = args.get(argName) // could be undefined
    const argIsCorrectType: Boolean = argCheckers.reduce((
        orResult: boolean,
        checker: ArgChecker,
        i: number,
        checkers: Immutable.List<ArgChecker>
      ) => Boolean(orResult || checker(arg)),
      false
    )
    assert( argIsCorrectType,
            `${arg} did not have type ${argTypes} for arg name ${argName}` )
    return arg
  })
}

type ArgMap = { [argName: string]: any }

export type CallableTransform = {
  (state: Immutable.Map<string,any>): Promise<Immutable.Map<string, any>>
  transform: Transform
}

export type TransformFunc = (args: any) => Promise<Immutable.Map<string,any> >

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
  const callable = async (state: Immutable.Map<string,any>) => {
    const inputArgs = checkExtractArgs(state, transform.inputTypes)
    const output = await transform.func(inputArgs.toJS())
    const outputArgs = checkExtractArgs(output, transform.outputTypes) 
    return output
  }
  callable.transform = transform
  return callable
}
type InputType = {firstArg: 'number', secondArg: 'number'}

const createOutputTypes = (outLabel?: string): Immutable.Map<string,any> => {
  const outMap: { [key: string]: any } = {}
  outMap[outLabel ? outLabel : 'sum'] = TYPES.number
  return Immutable.Map(outMap)
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

export const ADD_INPUT_TYPES: ArgTypes = Immutable.Map({firstArg: TYPES.number, secondArg: TYPES.number})
export const createAddTransform = (outLabel?: string): CallableTransform => {
  const func = async ({firstArg, secondArg}: InputType): Promise<Args> => {
    const outMap: { [key: string]: any } = {}
    outMap[outLabel ? outLabel : 'sum'] = Number(firstArg) + Number(secondArg)
    return new Promise((resolve) => {
      setTimeout(() => resolve(Immutable.Map(outMap)), 500)
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
