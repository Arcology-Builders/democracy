#!/usr/bin/env node

command    = process.argv[0]
network    = process.argv[1]
subcommand = process.argv[2]

console.log(`Usage ${command} [network] [subcommand]`)

console.log(`Network ${network}`)

web3 = require('./js/preamble')(network)

console.log(`${subcommand}`)

if (subcommand === 'accounts') {
  web3.accounts().then((value) => { console.log(JSON.stringify(value, " ")) })
}
