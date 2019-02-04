// lib.js, the entry point for Democracy, an undiscovered decentralized country

const { Map, Seq, List } = require('immutable')
const path   = require('path')
const assert = require('assert')
const BN = require('bn.js')

const { traverseDirs } = require('./utils')

// Menu of opt/arg processors to use in each subcommand below

argsOrDie = (args, argDescs, _requiredArgCount) => {
  const argCount = _requiredArgCount ? _requiredArgCount : argDescs.count()
  if (!args || args.count() < argCount) {
    console.log(" " + argDescs.map((argDesc, i) => {
	    return ` ${argDesc}=${args.get(i) ? args.get(i) : '?'}` }).toJS())
    process.exit(1)
  } else {
    console.log(" " + argDescs.map((argDesc, i) => {
	    return ` ${argDesc}=${args.get(i) ? args.get(i) : '?'}` }).toJS())
  }
}

getNetwork = (netName) => {
  console.log(`Network ${netName}`)
  return require('./preamble')(netName)
}

getAccounts = async (network) => {
  accounts = await network.accounts()
  return accounts
}

getAccountFromArg = (accounts, arg) => {
  if (arg.startsWith('account')) {
    let accountIndex = parseInt(arg.slice(7))
    return accounts[accountIndex]
  } else {
    throw new Error("Arg ${arg} should be of the form 'accountx'")
  }
}

/**
 * @param abi Immutable Seq of objects
 */
getConstructorArgs = (ctorArgs, abi) => {
  ctorMethods = abi.filter((obj) => { return obj.type === 'constructor' })
  assert(ctorMethods.count() == 1)
  console.log(`abi ${JSON.stringify(ctorMethods.get(0)['inputs'], null, "  ")}`)
  ctorObj = Seq(ctorMethods.get(0)['inputs'])
  return Map(ctorObj.map((obj) => {
    name = obj['name']
    type = obj['type']
    value = ctorArgs.get(name)
    if (!value) { throw new Error(`Missing constructor arg ${JSON.stringify(name)}`) }
    var coercedVal;
    if (type === "uint256") { coercedVal = new BN(value) }
    else coercedVal = value;
    return [name, coercedVal]
  }))
}

getContracts = (shouldPrint) => {
  const contractSources = []
  const contractOutputs = {}
  traverseDirs(
    ['src'], // start out by finding all contracts rooted in current directory
    (fnParts) => { return (fnParts.length > 1 && !fnParts[1].startsWith('sol')) },
    function(source, f) {
      fb = path.basename(f.split('.')[0])
      contractSources.push(fb)
      shouldPrint && console.log(`Source ${fb}`)
    }
  )
  traverseDirs(
    ['outputs'], // start out by finding all contracts rooted in current directory
    (fnParts) => { return ((fnParts.length > 1) &&
      (fnParts[1] !== 'json')) },
    function(source, f) {
      fb = path.basename(f.split('.')[0])
      if (contractSources.indexOf(fb) == -1) { return }
      contractOutputs[fb] = Map(JSON.parse(source))
      shouldPrint && console.log(`Compiled ${fb}`)
    }
  )
  return {
    contractSources: Seq(contractSources),
    contractOutputs: Map(contractOutputs)
  }
}

getContract = (contractName) => {
  const { contractOutputs } = getContracts()
  return contractOutputs.get(contractName)
}

/**
 * Return a link object read from a file in the `links/${networkId}` directory.
 * @param networkId name of the chain / network deployed onto
 * @param linkName the name of the contract and link ID of the form `ContractName-linkId`
 */
getLink = (networkId, linkName) => {
  const linkMap = getLinks(networkId)
  return linkMap.get(linkName)
}

/**
 * Return a deploy object read from a file
 * @param networkId name of the chain / network deployed onto
 * @param deployName the name of the contract and deploy of the form `ContractName-deployId`
 */
getDeploy = (networkId, deployName) => {
  const deployMap = getDeploys(networkId)
  return deployMap.get(deployName)
}

// Accepts List of "key1=val1","key2=val2","key3=val3"
// Return an Immutable Map of { 'key1' : 'val1', 'key2' : 'val2' }
getArgMap = (args) => {
  return Map(args.map((arg) => {
    if (!arg) return []
    const [ key, val ] = arg.split('=')
    if (!key || !val) {
      throw new Error(`Invalid dependency:address pair ${arg}`)
    }
    return [key, val]
  }))
}

doBalances = async (eth) => {
  const showBalances = true // change this later if you want it to be optional
  const accounts = await getAccounts(eth)
  accounts.map(async (address, i) => {
    let balance = await eth.getBalance(address).then((value) => { return value.toString() }) 
    let balanceString = showBalances ? `\t${balance} wei` : ''
    console.log(`accounts[${i}] ${address} ${balanceString}`)
  })    
}

TABLE = {

    undefined        : () => {
      const { contractOutputs } = getContracts() 
      contractOutputs.map((out) => { console.log(JSON.stringify(out, null, '  ')) })
    },

    'accounts': (args) => { doBalances(getNetwork(args.get(0))) },

    'info'    : (args) => {
      argsOrDie(args, List(['[0 ContractName]']))
      const { contractSources, contractOutputs } = getContracts() 
      console.log(JSON.stringify(contractOutputs.get(args.get(0)), null, '  '))
    },

    'compile' : (args) => {
      argsOrDie(args, List(['[0 ContractName]']))
      require('./compile')(args.get(0))
    },
	      
    'link'    : async (args) => {
      argsOrDie(args, List(['<0 ContractName>','<1 netName>','<2 deployerAccount>','<3 linkId>',
	      '[4 depLink1:depDeploy1 depLink2:depDeploy2 ... ]']), 4)
      const { contractOutputs } = getContracts()
      const contract     = contractOutputs.get(args.get(0))
      const net          = getNetwork(args.get(1))
      const accounts     = await getAccounts(net)
      const deployerAddr = getAccountFromArg(accounts, args.get(2))
      const linkId       = args.get(3)
      if (!linkId.startsWith("link")) {
        throw new Error("${linkId} should begin with `link`")
      }
      const linkMap      = getArgMap(args.slice(4))
      require('./link')(contract, net, deployerAddr, linkId, linkMap)
    },

    'deploy'  : async (args) => {
      argsOrDie(args, List(['<0 linkId>','<1 deployId>','[2 ctorArgs]']))
      const { contractOutputs } = getContracts()
      const contract     = contractOutputs.get(args.get(0))
      const net          = getNetwork(args.get(1))
      const deployId     = args.get(1)
      if (!deployId.startsWith("deploy")) {
        throw new Error("${deployId} should begin with `deploy`")
      }
      const linkMap      = getArgMap(args.get(4))
      const ctorArgs     = getConstructorArgs(getArgMap(args.get(5)), Seq(contract['abi']))
      console.log(`ctorArgs ${JSON.stringify(ctorArgs)}`)
      //const linkOutput   = require('./link')(contract, net, linkMap)
      require('./deploy')(contract, net, deployerAddr, deployId, linkMap, ctorArgs)
    }, 
}


let command      = ""
let subcommand   = ""

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
  getContract : getContract,
  getLink : getLink,
  getDeploy : getDeploy,
  getArgMap : getArgMap,
  doBalances : doBalances,
  TABLE : TABLE,
  demo : demo,
}
