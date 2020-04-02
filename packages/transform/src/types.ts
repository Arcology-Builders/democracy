'use strict'

const { isValidChecksumAddress }
                    = require('ethereumjs-util')
const BN            = require('bn.js')
const { assert }    = require('chai')
const { wallet }    = require('demo-keys')
const { isDeploy }  = require('demo-contract')

import * as Imm from 'immutable'

// Currently returns an error string or empty argect
// In the future, it could explicitly return a value or other information.
export type Result = {error?: string}
export type BooleanArgCheckerFunc = (arg: any) => Boolean
export type ArgCheckerFunc = (arg: any) => {error?: string}

type ArgCheckerBase = {
  (arg: any): Result
  typeName: string
  opt?: any
  childTypes?: any
}
type ArgCheckerOptional = {
  (arg: any): Result
  typeName: string
  opt: ArgCheckerBase
  childTypes?: any
}
type ArgCheckerMap = {
  (arg: any): Result
  typeName: string
  opt: ArgCheckerBase
  childTypes: ArgTypes
}
type ArgChecker = ArgCheckerBase | ArgCheckerOptional | ArgCheckerMap

export type ArgType    = ArgChecker
export type ArgMapType = ArgCheckerMap

export type Args     = Imm.Map<string,any>
export type ArgTypes = Imm.Map<string,ArgType>

export const makeCheckerFromBoolean = (
  booleanChecker : BooleanArgCheckerFunc,
  typeName       : string,
): ArgCheckerFunc => {
  return (arg: any) => {
    const argString = (
      (typeof(arg) === 'object') && (!Array.isArray(arg)) && (arg !== null)
    ) ?
      `object with keys ${JSON.stringify(Imm.List(Imm.Map(arg).keys()).toJS())}` :
      JSON.stringify(arg)
    return booleanChecker(arg) ?
      {} : {error: `Arg ${argString} did not have type ${typeName}`}
  }
}

export const makeRequired = (checkerFunc: ArgCheckerFunc, typeName: string): ArgType => {
  const callable = (arg: any) => checkerFunc(arg)
  callable.typeName = typeName
  return callable
}

export const makeOptional = (checkerFunc: ArgCheckerFunc, typeName: string): ArgType => {
  const callable = (arg: any) => (arg === undefined) ? {} : checkerFunc(arg)
  callable.typeName = typeName + '?'
  return callable
}

export const makeMapType = (
  mapType: ArgTypes,
  typeName: string
): ArgType => {
  const checkerFunc: ArgCheckerFunc = (arg: any) => {
    if (!Imm.Map.isMap(arg)) {
      return {error: `Passed in a non-map arg to a map type ${typeName}`}
    }
    const errorString : string = mapType.reduce((s: string, subArgChecker: ArgType, subArgName: string) => {
      const subArg = arg.get(subArgName)
      const subSatisfied = subArgChecker(subArg)
      if (!subSatisfied) {
        return `Arg checker ${subArgChecker} for sub arg ${subArgName} returns null result`
      }
      if (subSatisfied['error']) {
        return `Map-type sub-arg "${subArgName}: ${subArg}" does not have type ${subArgChecker.typeName} instead ${typeof(subArg)}. ${subSatisfied['error']}`
      }
      return s + (subSatisfied['error'] || '')
    }, '')
    return {error: errorString}
  }
  const newType = makeRequired(checkerFunc, typeName)
  newType.opt   = makeOptional(checkerFunc, typeName)
  newType.childTypes = mapType
  return newType
}

type ArgMap = { [argName: string]: any }

const HEX_CHARS = '01234567890abcdef'

export const isHexPrefixed = (arg: any, length?: number, prefixed: boolean=true): Result => {
  const allHexChars = (s: Result , v: string, k: number): Result =>
    (HEX_CHARS.search(v.toLowerCase()) > -1) ? s :
      {error: `Non-hex char ${v} found at position ${k}`}

  if (typeof(arg) !== 'string') {
    return {error: `${arg} has type ${typeof(arg)} instead of string`}
  }
  if (Boolean(prefixed) === true && arg.slice(0,2) !== '0x') {
    return {error: `${arg} does not begin with 0x`}
  }
  if (length && arg.length !== length) {
    return {error: `${arg} has length ${arg.length} instead of ${length}`}
  }
  return Imm.List(arg.slice(2)).reduce(allHexChars, {})
}

const contractCheckerFunc = (arg: any) =>  
  Boolean(arg && isDeploy(arg.deploy) && arg.deployerEth['prepareSignerEth'])

const contractInstanceCheckerFunc = (arg: any) =>
  Boolean(arg && arg['abi'] && isValidChecksumAddress(arg['address']))

// Standard arg types / checkers
const BOOLEAN_CHECKERS: Imm.Map<string,BooleanArgCheckerFunc> = Imm.Map({
  'string'          : (arg: any) => (typeof(arg) === 'string'),
  'number'          : (arg: any) => (typeof(arg) === 'number'),
  'boolean'         : (arg: any) => (typeof(arg) === 'boolean'),
  'map'             : (arg: any) => (Imm.Map.isMap(arg)),
  'list'            : (arg: any) => (Imm.List.isList(arg)),
  'badType'         : (arg: any) => false,
  'any'             : (arg: any) => true,
  'integer'         : (arg: any) => Number.isInteger(arg),
  'floatString'     : (arg: any) => (
    (typeof(arg) === 'string') && (String(parseFloat(arg)) === arg)
  ),
  'float'           : (arg: any) => typeof(parseFloat(arg)) === 'number',
  'function'        : (arg: any) => (typeof(arg) === 'function'),
  'ethereumAddress' : (arg: any) => isValidChecksumAddress(arg),
  'ethereumSigner'  : (arg: any) => Boolean(arg && arg['net_version']),
  'contract'        : contractCheckerFunc,
  'contractInstance': contractInstanceCheckerFunc,
  'bm'              : (arg: any) => Boolean(arg && arg['getDeploys']),
  'wallet'          : (arg: any) => Boolean(arg && arg['prepareSignerEth']),
  'array'           : (arg: any) => Array.isArray(arg),
  'bn'              : (arg: any) => BN.isBN(arg),
})

/**
 * Create a checker function (that returns a [[Result]]) with an optional
 * type (called `opt`) from a 
 * boolean checker function (that returns `true` if the typecheck passes and
 * `false` otherwise.
 * @param booleanChecker the boolean checker function to convert
 * @param typeName a short descriptive name for this type
 */
export const makeCheckerFuncFromBoolean = 
  (booleanChecker: BooleanArgCheckerFunc, typeName: string): ArgChecker => {
        const checker = makeCheckerFromBoolean(booleanChecker, typeName)
        const requiredChecker = makeRequired(checker, typeName)
        requiredChecker.opt = makeOptional(checker, typeName)
        return requiredChecker
}

export const makeCheckerFunc = 
  (checker: ArgCheckerFunc, typeName: string): ArgChecker => {
        const requiredChecker = makeRequired(checker, typeName)
        requiredChecker.opt = makeOptional(checker, typeName)
        return requiredChecker
}

export const TYPES_MAP: Imm.Map<string,ArgChecker>
  = BOOLEAN_CHECKERS.map(makeCheckerFuncFromBoolean).
  merge({
    'hexPrefixed'    : makeCheckerFunc(
      (arg: any) => isHexPrefixed(arg), 'hexPrefixed'
    ),
    'keccak256Prefixed'  : makeCheckerFunc(
      (arg: any) => isHexPrefixed(arg, 66, true), 'keccak256Hash'
    ), 
    'keccak256Hash'  : makeCheckerFunc(
      (arg: any) => isHexPrefixed(arg, 64, false), 'keccak256Hash'
    ), 
    'ethereumTxHash' : makeCheckerFunc(
      (arg: any) => isHexPrefixed(arg, 66, true), 'ethereumTxHash'
    ),
  })

export const TYPES: { [key: string] : ArgChecker } = TYPES_MAP.toJSON()

export const checkExtractArgs = (args: Imm.Map<string,any>, argTypes: ArgTypes) => {
  return argTypes.map((argType: ArgType, argName: string) => {
    const argCheckers = Imm.List([argType])
    const arg = args.get(argName) // could be undefined
    const errorString: string = argCheckers.reduce((
        errorString: string,
        checker: ArgChecker,
        i: number,
        checkers: Imm.List<ArgChecker>
      ) => {
        return errorString + (checker(arg)['error'] || '')
      },
      ''
    )
    assert.equal( errorString, '',
      `Arg named ${argName} mismatched type ${argType.typeName} ` +
      `with error string ${errorString}` )
    return arg
  })
}
