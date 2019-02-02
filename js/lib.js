// lib.js, the entry point for Democracy, an undiscovered decentralized country

const { Map, Seq } = require('immutable')
const path   = require('path')
const assert = require('assert')
const BN = require('bn.js')

const { traverseDirs } = require('./utils')

// Menu of opt/arg processors to use in each subcommand below

argsOrDie = (args, msg) => {
  if (!args || args.length == 0) {
    console.log(`\n  ${path.basename("")} ${subcommand} ${msg}\n`)
    process.exit(1)
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
  console.log(`${arg}`)
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

getContracts = () => {
  const contractSources = []
  const contractOutputs = {}
  traverseDirs(
    ['src'], // start out by finding all contracts rooted in current directory
    (fnParts) => { return (fnParts.length > 1 && !fnParts[1].startsWith('sol')) },
    function(source, f) {
      fb = path.basename(f.split('.')[0])
      contractSources.push(fb)
      console.log(`Source ${fb}`)
    }
  )
  traverseDirs(
    ['outputs'], // start out by finding all contracts rooted in current directory
    (fnParts) => { return ((fnParts.length > 1) &&
      (fnParts[1] !== 'json')) },
    function(source, f) {
      fb = path.basename(f.split('.')[0])
      if (contractSources.indexOf(fb) == -1) { return }
      contractOutputs[fb] = JSON.parse(source)
      console.log(`Compiled ${fb}`)
    }
  )
  return {
    contractSources: Seq(contractSources),
    contractOutputs: Map(contractOutputs)
  }
}

// Accepts string of "key1=val1,key2=val2,key3=val3"
// Return an Immutable Map of { 'key1' : 'val1', 'key2' : 'val2' }
getArgMap = (args) => {
  return Map(args.split(',').map((arg) => {
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

    'accounts': (args) => { doBalances(getNetwork(args[0])) },

    'info'    : (args) => {
      const { contractSources, contractOutputs } = getContracts() 
      console.log(JSON.stringify(contractOutputs.get(args[0]), null, '  '))
    },

    'compile' : (args) => {
      // compile [0 ContractName]
      require('./compile')(args[0])
    },
	      
    'link'    : (args) => {
      argsOrDie(args,
        '<0 ContractName> <1 netName> [2 depLink1:depDeploy1 depLink2:depDeploy2 ... ]')
      const { contractOutputs } = getContracts()
      const contract     = contractOutputs.get(args[0])
      const net          = getNetwork(args[1])
      const linkMap      = getDepMap(args.slice(2))
      require('./link')(contract, net, linkMap)
    },

    'deploy'  : async (args) => {
      argsOrDie(args,
	'<0 ContractName> <1 netName> <2 deployerAddr> <3 deployId> ["4 linkMap"] ["5 ctorArgs"]')
      const { contractOutputs } = getContracts()
      const contract     = contractOutputs.get(args[0])
      const net          = getNetwork(args[1])
      const accounts     = await getAccounts(net)
      const deployerAddr = getAccountFromArg(accounts, args[2])
      const deployId     = args[3]
      const linkMap      = getArgMap(args[4])
      const ctorArgs     = getConstructorArgs(getArgMap(args[5]), Seq(contract['abi']))
      console.log(`ctorArgs ${JSON.stringify(ctorArgs)}`)
      //const linkOutput   = require('./link')(contract, net, linkMap)
      require('./deploy')(contract, net, deployerAddr, deployId, linkMap, ctorArgs)
    }, 
}


let command      = ""
let subcommand   = ""

// Arg numbers might depend on how we invoke this script
const start = (path.basename(process.argv[0]) === 'node') ? 1 : 0

async function demo(...args) {
  command = args[0]
  subcommand = args[1]
  console.log(`Command ${command}`)
  console.log(`Subcommand ${subcommand}`)
  TABLE[subcommand](args.slice(start+2))
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
