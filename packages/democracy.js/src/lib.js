// lib.js, the entry point for Democracy, an undiscovered decentralized country

const { Map, Seq, List, fromJS } = require('immutable')
const path   = require('path')
const assert = require('assert')
const BN = require('bn.js')

const { print, traverseDirs, getLink, SOURCES_DIR, COMPILES_DIR }
  = require('@democracy.js/utils')

// Menu of opt/arg processors to use in each subcommand below

const argsOrDie = (args, argDescs, _requiredArgCount) => {
  const argCount = _requiredArgCount ? _requiredArgCount : argDescs.count()
  if (!args || args.count() < argCount) {
    console.log(' ' + argDescs.map((argDesc, i) => {
	    return ` ${argDesc}=${args.get(i) ? args.get(i) : '?'}` }).toJS())
    process.exit(1)
  } else {
    console.log(' ' + argDescs.map((argDesc, i) => {
	    return ` ${argDesc}=${args.get(i) ? args.get(i) : '?'}` }).toJS())
  }
}

const getNetwork = (netName, _config) => {
  console.log(`Network ${netName}`)
  const Eth = require('ethjs')
  const config = (_config) ? _config : require('config')
  return new Eth(new Eth.HttpProvider(config['endpoints'][netName]))
}

const getAccounts = async (network) => {
  accounts = await network.accounts()
  return accounts
}

const getAccountFromArg = (accounts, arg) => {
  if (arg.startsWith('account')) {
    let accountIndex = parseInt(arg.slice(7))
    return accounts[accountIndex]
  } else {
    throw new Error('Arg ${arg} should be of the form \'accountx\'')
  }
}

/**
 * @param abi Immutable Seq of objects
 */
const getConstructorArgs = (ctorArgMap, abi) => {
  console.log(`ctorArgMap ${ctorArgMap.toString()}`)
  ctorMethods = abi.filter((obj) => { return obj.get('type') === 'constructor' })
  if (ctorMethods.count() < 1) { // this is a library, or has no ctor
    return Map({})
  }
  assert(ctorMethods.count() == 1)
  console.log(`abi ${JSON.stringify(ctorMethods.get(0).get('inputs'), null, '  ')}`)
  ctorObj = ctorMethods.get(0).get('inputs')
  return Map(ctorObj.map((obj) => {
    name = obj.get('name')
    type = obj.get('type')
    value = ctorArgMap.get(name)
    if (!value) { throw new Error(`Missing constructor arg ${JSON.stringify(name)}`) }
    var coercedVal
    if (type === 'uint256') {
	    coercedVal = new BN(value)
      console.log('bignum')
    }
    else coercedVal = value
    console.log(`name ${name} val ${coercedVal}`)
    return [name, coercedVal]
  }))
}

const getContracts = (shouldPrint) => {
  const contractSources = []
  const contractOutputs = {}
  traverseDirs(
    [SOURCES_DIR], // start out by finding all contracts rooted in current directory
    (fnParts) => { return (fnParts.length > 1 && !fnParts[1].startsWith('sol')) },
    function(source, f) {
      fb = path.basename(f.split('.')[0])
      contractSources.push(fb)
      shouldPrint && console.log(`Source ${fb}`)
    }
  )
  traverseDirs(
    [COMPILES_DIR], // start out by finding all contracts rooted in current directory
    (fnParts) => { return ((fnParts.length > 1) &&
      (fnParts[1] !== 'json')) },
    function(source, f) {
      fb = path.basename(f.split('.')[0])
      if (contractSources.indexOf(fb) == -1) { return }
      contractOutputs[fb] = fromJS(JSON.parse(source))
      shouldPrint && console.log(`Compiled ${fb}`)
    }
  )
  return {
    contractSources: Seq(contractSources),
    contractOutputs: Map(contractOutputs)
  }
}

// Accepts List of "key1=val1","key2=val2","key3=val3"
// Return an Immutable Map of { 'key1' : 'val1', 'key2' : 'val2' }
const getArgMap = (args) => {
  return Map(args.map((arg) => {
    if (!arg) return []
    const [ key, val ] = arg.split('=')
    if (!key || !val) {
      throw new Error(`Invalid dependency:address pair ${arg}`)
    }
    return [key, val]
  }))
}

const doBalances = async (eth) => {
  const showBalances = true // change this later if you want it to be optional
  const accounts = await getAccounts(eth)
  accounts.map(async (address, i) => {
    let balance = await eth.getBalance(address).then((value) => { return value.toString() }) 
    let balanceString = showBalances ? `\t${balance} wei` : ''
    console.log(`accounts[${i}] ${address} ${balanceString}`)
  })    
}

const TABLE = {

  undefined        : () => {
    const { contractOutputs } = getContracts() 
    contractOutputs.map((out) => { console.log(JSON.stringify(out, null, '  ')) })
  },

  'accounts': async (args) => { return doBalances(getNetwork(args.get(0))) },

  'info'    : (args) => {
    argsOrDie(args, List(['[0 ContractName]']))
    const { contractSources, contractOutputs } = getContracts() 
    console.log(JSON.stringify(contractOutputs.get(args.get(0)), null, '  '))
  },

  'compile' : async (args) => {
    argsOrDie(args, List(['[0 sourcePath]','<1 ContractName>']), 1)
    return require('./compile')(args.get(0), args.get(1))
  },
	      
  'link'    : async (args) => {
    argsOrDie(args, List(['<0 ContractName>','<1 netName>','<2 deployerAccount>','<3 linkId>',
	      '[4 depLink1:depDeploy1 depLink2:depDeploy2 ... ]']), 4)
    const { contractOutputs } = getContracts()
    const contractName = args.get(0)
    const contract     = contractOutputs.get(contractName)
    if (!contract) {
      throw new Error(`${contractName} compile output not found.`)
    }
    const net          = getNetwork(args.get(1))
    const accounts     = await getAccounts(net)
    const deployerAddr = getAccountFromArg(accounts, args.get(2))
    const linkId       = args.get(3)
    if (!linkId.startsWith('link')) {
      throw new Error('${linkId} should begin with `link`')
    }
    const linkMap      = getArgMap(args.slice(4))
    return require('./link')(contract, net, deployerAddr, linkId, linkMap)
  },

  'deploy'  : async (args) => {
    argsOrDie(args, List(['<0 ContractName>','<1 netName>','<2 linkId>','<3 deployId>','[4 ctorArgs]']), 3)
    const net          = getNetwork(args.get(1))
    const networkId    = await net.net_version()
    const linkName     = `${args.get(0)}-${args.get(2)}`
    const link         = getLink(networkId, linkName)
    if (!link) { throw new Error(`${linkName} not found`) }
    const deployId     = args.get(3)
    if (!deployId.startsWith('deploy')) {
      throw new Error(`${deployId} should begin with 'deploy'`)
    }
    const ogCtorArgs   = args.get(4)
    const ctorArgs = (Map.isMap(ogCtorArgs)) ? ogCtorArgs : 
      (ogCtorArgs ? getArgMap(List(args.get(4).split(','))) : Map({}))

    const matchedCtorArgs = getConstructorArgs(ctorArgs, link.get('abi'))
    console.log(`ctorArgs ${JSON.stringify(ctorArgs)}`)
    return require('./deploy')(net, link, deployId, matchedCtorArgs)
  }, 

  'do' : async (args) => {
    argsOrDie(args, List(['<0 ContractName>','<1 netName>','<2 deployId>','<3 doerAccount>','<4 methodName>','<5 args>']), 5)
    const contractName = args.get(0)
    const net          = getNetwork(args.get(1))
    const accounts     = await getAccounts(net)
    const deployerAddr = getAccountFromArg(accounts, args.get(3))
    const networkId    = await net.net_version()
    const deployId     = args.get(2)
    const deployName   = `${contractName}-${deployId}`
    const deploy       = getDeploy(networkId, deployName)
    const methodName   = args.get(4)
    const argMap       = (args.get(5)) ? getArgMap(List(args.get(5).split(','))) : Map({})
    return require('./do')(net, deploy, methodName, argMap)
  },

  'get' : (args) => {
    argsOrDie(args, List(['<0 key>','<1 defaultValue]']), 1)
    const value = require('./get')(...args)
    console.log(`Value ${value.toString()}`)
    return value 
  },

  'set' : (args) => {
    argsOrDie(args, List(['<0 key>','<1 value>']), 2)
    const valArg = args.get(1)
    const value = (Map.isMap(valArg) || List.isList(valArg) || !valArg) ?
      valArg : fromJS(JSON.parse(valArg)) 
    return require('./set')(args.get(0), value)
  },
  
  'bind' : (args) => {
    argsOrDie(args, List(['<0 alias>','<1 cmd1,...,cmdk>','[2 boundparam=cmdparam,...]','[3 freeparam=cmdparam,...]']), 2)
    const alias = args.get(0)
    const cmds = List(args.get(1).split(','))
    const boundParamMap = args.get(2) ? getArgMap(List(args.get(2))) : Map({})
    const freeParamMap = args.get(3) ? getArgMap(List(args.get(3))) : Map({})
    return require('./bind')(alias, cmds, boundParamMap, freeParamMap)
  },
}


// Arg numbers might depend on how we invoke this script
const start = (path.basename(process.argv[0]) === 'node') ? 1 : 0

async function demo(args) {
  // These are global consts, not ideal
  const command = args.get(start+1)
  console.log(`Command ${command}`)
  console.log(`arg ${args.get(start+2)}`)
  TABLE[command](args.slice(start+2))
}

module.exports = {
  argsOrDie : argsOrDie,
  getNetwork : getNetwork,
  getAccounts : getAccounts,
  getAccountFromArg : getAccountFromArg,
  getConstructorArgs : getConstructorArgs,
  getContracts : getContracts,
  getArgMap : getArgMap,
  doBalances : doBalances,
  TABLE : TABLE,
  demo : demo,
}
