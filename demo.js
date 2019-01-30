#!/usr/bin/env node
// demo.js, the entry point for Democracy, an undiscovered decentralized country

const { Seq } = require('immutable')
const path = require('path')

const start = (path.basename(process.argv[0]) === 'node') ? 1 : 0
const command    = process.argv[start]   
const subcommand = process.argv[start+1]
/*
if (process.argv.length < start+1) {
  console.log(`Usage ${command} [subcommand]`)
  process.exit(1)
}
*/
console.log(`Command ${command}`)
console.log(`Subcommand ${subcommand}`)

// Menu of opt/arg processors to use in each subcommand below
getNetwork = (index) => {
  network = process.argv[start+index]
  console.log(`Network ${network}`)
  return require('./js/preamble')(network)
}

eth = {}

getBalances = async () => {
  eth = getNetwork(2)
  console.log(JSON.stringify(eth));
  showBalances = (process.argv[start+3] === 'balances')
  accounts = await eth.accounts()
  accounts.map(async (address, i) => {
    let balance = await eth.getBalance(address).then((value) => { return value.toString() }) 
    let balanceString = showBalances ? `\t${balance} wei` : ''
    console.log(`accounts[${i}] ${address} ${balanceString}`)
  })    
}

const { traverseDirs } = require('./js/utils')

contractOutputs = {}
contractSources = []

getContractNames = () => {
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

// Find out what available contract names we have
getContractNames()

async function main() {

  TABLE = {
    'accounts': () => { getBalances() },
    'compile' : () => { getCompile()  },
  }

  CONTRACT_SUBTABLE = {
    ''        : (contractName) => { console.log(JSON.stringify(contractOutputs[contractName])) },
    'link'    : () => { require('./js/link')(getNetwork(3), getDepMap(4)) }, 
    'deploy'  : () => { require('./js/deploy')(getNetwork(3), process.argv[start+4]) }, 
  }

  subcommand && console.log(`${subcommand}`)
  if (!subcommand) {
    console.log("Available Contract Names:");
  } else if (TABLE[subcommand]) {
    TABLE[subcommand]()
  } else if (contractOutputs[subcommand]) {
    subsubcommand = process.argv[start+3] || ''
    console.log(`subsubcommand ${subsubcommand}`)
    CONTRACT_SUBTABLE[subsubcommand](subcommand)
  } 

}

// Do the thing
main().then(() => { })
