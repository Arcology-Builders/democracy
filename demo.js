#!/usr/bin/env node
// demo.js, the entry point for Democracy framework

const { Seq } = require('immutable')
const path = require('path')

const start = (path.basename(process.argv[0]) === 'node') ? 1 : 0
const command    = process.argv[start]   
const subcommand = process.argv[start+1]

console.log(start)
console.log(process.argv.length < start+1)
if (process.argv.length < start+2) {
  console.log(`Usage ${command} [subcommand]`)
  process.exit(1)
}
console.log(`Command ${command}`)
console.log(`Subcommand ${subcommand}`)

// Menu of opt/arg processors to use in each subcommand below
getNetwork = () => {
  network = process.argv[start+2]
  console.log(`Network ${network}`)
  return require('./js/preamble')(network)
}

getBalances = async () => {
  eth = getNetwork()
  console.log(JSON.stringify(eth));
  showBalances = (process.argv[start+3] === 'balances')
  accounts = await eth.accounts()
  accounts.map(async (address, i) => {
    let balance = await eth.getBalance(address).then((value) => { return value.toString() }) 
    let balanceString = showBalances ? `\t${balance} wei` : ''
    console.log(`accounts[${i}] ${address} ${balanceString}`)
  })    
}

getCompile = async() => {
  compileName = process.argv[start+2]
  console.log(`Compile Name ${compileName}`)
  require('./js/compile')(compileName)
}

async function main() {

  table = {
    'accounts': () => { getBalances() },
    'compile' : () => { getCompile()  },
    'deploy'  : () => { getNetwork()  },
  }

  subcommand && console.log(`${subcommand}`)
  table[subcommand]()

}

// Do the thing
main().then(() => { })
