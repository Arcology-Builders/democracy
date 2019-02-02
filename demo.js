#!/usr/bin/env node
// demo.js, the entry point for Democracy, an undiscovered decentralized country

const { Map, Seq } = require('immutable')
const path = require('path')

// Arg numbers might depend on how we invoke this script
const start = (path.basename(process.argv[0]) === 'node') ? 1 : 0

// Standardize args
const command      = process.argv[start]   
const subcommand   = process.argv[start+1]

console.log(`Command ${command}`)
console.log(`Subcommand ${subcommand}`)

// Menu of opt/arg processors to use in each subcommand below

argsOrDie = (args, msg) => {
  if (args.length == 0) {
    console.log(`\n  ${path.basename(command)} ${subcommand} ${msg}\n`)
    process.exit(1)
  }
}

getNetwork = (netName) => {
  console.log(`Network ${netName}`)
  return require('./js/preamble')(netName)
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

const { traverseDirs } = require('./js/utils')

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

// Return a map of { 'dependencyName' : 'deployId' }
getDepMap = (argsUntilEnd) => {
  return argsUntilEnd.map((arg) => {
    const [ dep, deployId ] = arg.split(':')
    if (!dep || !deployId) {
      throw new Error(`Invalid dependency:address pair ${arg}`)
    }
  })
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


async function main() {

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
      require('./js/compile')(args[0])
    },
	      
    'link'    : (args) => {
      argsOrDie(args,
        '<0 ContractName> <1 netName> [2 depLink1:depDeploy1 depLink2:depDeploy2 ... ]')
      const { contractOutputs } = getContracts()
      const contract     = contractOutputs[args[0]]
      const net          = getNetwork(args[1])
      const linkMap      = getDepMap(args.slice(2))
      require('./js/link')(contract, net, linkMap)
    },

    'deploy'  : async (args) => {
      argsOrDie(args,
	'<0 ContractName> <1 netName> <2 deployerAddr> <3 deployId> [4 linkId]')
      const { contractOutputs } = getContracts()
      const contract     = contractOutputs.get(args[0])
      const net          = getNetwork(args[1])
      const accounts     = await getAccounts(net)
      const deployerAddr = getAccountFromArg(accounts, args[2])
      const deployId     = args[3]
      const linkMap      = args[4]
      require('./js/deploy')(contract, net, deployerAddr, deployId, linkMap)
    }, 
  }

  subcommand && console.log(`${subcommand}`)
  TABLE[subcommand](process.argv.slice(start+2))

}

// Do the thing
main().then(() => { })
