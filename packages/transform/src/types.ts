'use strict'

const { isValidChecksumAddress }
                    = require('ethereumjs-util')
const BN            = require('bn.js')
const { assert }    = require('chai')
const { wallet }    = require('demo-keys')
const { isDeploy }  = require('demo-contract')

import * as Imm from 'immutable'

// These don't ever need to be exported
export type BooleanArgCheckerFunc = (arg: any) => Boolean
export type ArgCheckerFunc = (arg: any) => {error?: string}

type ArgCheckerBase = {
  (arg: any): {error?: string}
  typeName: string
  opt?: any
  childTypes?: any
}
type ArgCheckerOptional = {
  (arg: any): {error?: string}
  typeName: string
  opt: ArgCheckerBase
  childTypes?: any
}
type ArgCheckerMap = {
  (arg: any): {error?: string}
  typeName: string
  opt: ArgCheckerBase
  childTypes: ArgTypes
}
type ArgChecker = ArgCheckerBase | ArgCheckerOptional | ArgCheckerMap

export type ArgType = ArgChecker
export type ArgMapType = ArgCheckerMap

export type Args     = Imm.Map<string,any>
export type ArgTypes = Imm.Map<string,ArgType>

export const makeCheckerFromBoolean = (
  booleanChecker : BooleanArgCheckerFunc,
  typeName       : string,
): ArgCheckerFunc => {
  return (obj: any) => booleanChecker(obj) ?
    {} : {error: `Arg ${obj} did not have type ${typeName}`}
}

export const makeRequired = (checkerFunc: ArgCheckerFunc, typeName: string): ArgType => {
  const callable = (obj: any) => checkerFunc(obj)
  callable.typeName = typeName
  return callable
}

export const makeOptional = (checkerFunc: ArgCheckerFunc, typeName: string): ArgType => {
  const callable = (obj: any) => (obj === undefined) ? {} : checkerFunc(obj)
  callable.typeName = typeName + '?'
  return callable
}

export const makeMapType = (subStateLabel: string, mapType: ArgTypes, typeName: string): ArgType => {
  const checkerFunc: ArgCheckerFunc = (obj: any) => {
    if (!Imm.Map.isMap(obj)) {
      return {error: `Passed in a non-map arg to a map type ${typeName}`}
    }
    const errorString : string = mapType.reduce((s: string, subArgChecker: ArgType, subArgName: string) => {
      const subArg = obj.get(subArgName)
      const subSatisfied = subArgChecker(subArg)
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

// Standard arg types / checkers
const BASE_TYPES: Imm.Map<string,BooleanArgCheckerFunc> = Imm.Map({
  'string' : (arg: any) => (typeof(arg) === 'string'),
  'number' : (arg: any) => (typeof(arg) === 'number'),
  'boolean': (arg: any) => (typeof(arg) === 'boolean'),
  'map'    : (arg: any) => (Imm.Map.isMap(arg)),
  'list'   : (arg: any) => (Imm.List.isList(arg)),
  'badType': (arg: any) => false,
  'any'    : (arg: any) => true,
  'integer': (arg: any) => Number.isInteger(arg),
  'float'  : (arg: any) => typeof(parseFloat(arg)) === 'number',
})

export const TYPES_MAP: Imm.Map<string,ArgChecker> = BASE_TYPES.map(
  (booleanChecker: BooleanArgCheckerFunc, typeName: string): ArgChecker => {
    const checker = makeCheckerFromBoolean(booleanChecker, typeName)
    const requiredChecker = makeRequired(checker, typeName)
    requiredChecker.opt   = makeOptional(checker, typeName)
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
            `Arg named ${argName} mismatched type ${argType.typeName} with error string ${errorString}` )
    return arg
  })
}

type ArgMap = { [argName: string]: any }

export const subStateKey = (subStateLabel: string, bareKey: string) => {
  return (subStateLabel) ?
        subStateLabel + bareKey[0].toUpperCase() + bareKey.slice(1) :
        bareKey
}

const HEX_CHARS = '01234567890abcdef'

export const isHexPrefixed = (obj: any) => {
  const allHexChars = (s: boolean , v: string, k: number) => Boolean(s && HEX_CHARS.search(v.toLowerCase()) > -1)
  return (typeof(obj) === 'string') && (obj.slice(0,2) === '0x') &&
    Imm.List(obj.slice(2)).reduce(allHexChars, true)
}

const contractCheckerFunc = (obj: any) =>  
  Boolean(obj && isDeploy(obj.deploy) && obj.deployerEth['prepareSignerEth'])

const contractInstanceCheckerFunc = (obj: any) =>
  Boolean(obj && obj['abi'] && isValidChecksumAddress(obj['address']))

const DEMO_CHECKER_FUNCS = Imm.Map({
  'function'        : (obj: any) => (typeof(obj) === 'function'),
  'ethereumTxHash'  : (obj: any) => (isHexPrefixed(obj) && obj.length === 66),
  'ethereumAddress' : (obj: any) => isValidChecksumAddress(obj),
  'ethereumSigner'  : (obj: any) => Boolean(obj && obj['net_version']),
  'contract'        : contractCheckerFunc,
  'contractInstance': contractInstanceCheckerFunc,
  'bm'              : (obj: any) => Boolean(obj && obj['getDeploys']),
  'wallet'          : (obj: any) => Boolean(obj && obj['prepareSignerEth']),
  'array'           : (obj: any) => Array.isArray(obj),
  'bn'              : (obj: any) => BN.isBN(obj),
  'any'             : (obj: any) => true,
})

export const DEMO_TYPES = DEMO_CHECKER_FUNCS.map((booleanChecker: BooleanArgCheckerFunc, typeName: string) => {
  const checker = makeCheckerFromBoolean(booleanChecker, typeName)
  const requiredChecker = makeRequired(checker, typeName)
  requiredChecker.opt = makeOptional(checker, typeName)
  return requiredChecker
}).merge(TYPES_MAP).toJSON()
