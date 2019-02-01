#!/usr/bin/env node
// demo.js, the entry point for Democracy, an undiscovered decentralized country

const { Seq } = require('immutable')
const path = require('path')

// Arg numbers might depend on how we invoke this script
const start = (path.basename(process.argv[0]) === 'node') ? 1 : 0

// Standardize args
const command      = process.argv[start]   
const subcommand   = process.argv[start+1]

/*
if (process.argv.length < start+1) {
  console.log(`Usage ${command} [subcommand]`)
  process.exit(1)
}
*/
console.log(`Command ${command}`)
console.log(`Subcommand ${subcommand}`)

// Menu of opt/arg processors to use in each subcommand below

getNetwork = (nextArgIndex) => {
  network = process.argv[nextArgIndex]
  console.log(`Network ${network}`)
  return require('./js/preamble')(network)
}

eth = {}
accounts = []

getAccounts = async (nextArgIndex) => {
  eth = getNetwork(nextArgIndex)
  accounts = await eth.accounts()
  return accounts
}

doBalances = async (nextArgIndex) => {
  eth = getNetwork(nextArgIndex)
  showBalances = true // change this later if you want it to be optional
  const accounts = await getAccounts()
  accounts.map(async (address, i) => {
    let balance = await eth.getBalance(address).then((value) => { return value.toString() }) 
    let balanceString = showBalances ? `\t${balance} wei` : ''
    console.log(`accounts[${i}] ${address} ${balanceString}`)
  })    
}

const { traverseDirs } = require('./js/utils')

getContractNames = () => {
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
    contractSources: contractSources,
    contractOutputs: contractObjects
  }
}

const ethUtil = require('ethereumjs-util')

// Return a map of { 'dependencyName' : 'deployId' }
getDepMap = (indexFromStart) => {
  depMap = {}
  for (var i = process.argv[start+index]; i < process.argv.length; i++) {
    const [ dep, deployId ] = process.argv[i].split(':')
    if (!dep || !deployId) {
      throw new Error(`Invalid dependency:address pair ${process.argvi[i]}`)
    }
    depMap[dep] = deployId
  }
  return depMap
}

getCompile = async() => {
  compileName = process.argv[start+2]
  console.log(`Compile Name ${compileName}`)
  require('./js/compile')(compileName)
}

getArg = (indexFromStart) => {
  let index = start + indexFromStart,
      arg = process.argv[start+indexFromStart]
  if (!arg) throw new Error(`Missing arg at index ${index}`)
  return arg 
}

// Find out what available contract names we have
getContractNames()

async function main() {

  TABLE = {
    'accounts': () => { doBalances() },
    'compile' : () => { require('./js/compile')  },
  }

  CONTRACT_SUBTABLE = {
    ''        : (contractName) => { console.log(JSON.stringify(contractOutputs[contractName])) },
    'link'    : (contractName) => { require('./js/link')(getNetwork(3), contractName, getDepMap(4)) }, 
    'deploy'  : async(contractName) => {
	accounts = await getAccounts()
	// TODO This needs to be cleaned up, especially to unlock accounts for public spending
	if (process.argv[start+4].startsWith('account')) {
	  console.log(process.argv[start+4])
	  let accountIndex = parseInt(process.argv[start+4].slice(7))
	  let deployerAddr = accounts[accountIndex]
	  console.log(`Spending from account ${accountIndex}: ${deployerAddr}`)
          require('./js/deploy')(getNetwork(3), deployerAddr, contractOutputs[contractName], process.argv[start+5])
	} }, 
  }

  subcommand && console.log(`${subcommand}`)
  if (!subcommand) {
    console.log("Available Contract Names:");
  } else if (TABLE[subcommand]) {
    TABLE[subcommand](contractOutputs[process.argv[start+2])
  } else if (contractOutputs[subcommand]) {
    subsubcommand = process.argv[start+2] || ''
    console.log(`subsubcommand ${subsubcommand}`)
    CONTRACT_SUBTABLE[subsubcommand](subcommand)
  } 

}

// Do the thing
main().then(() => { })
