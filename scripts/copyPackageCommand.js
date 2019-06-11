#!/usr/bin/env node
'use strict'

// Copy a command from top-level package.json to a lerna package 
// optional [rev] reverses the copy from a lerna package to the top-level
// Usage: ./copyPackageCommand.js cov depart [rev]

const topPackageJSON = require('../package.json')

if (process.argv.length < 4) {
  throw new Error(`Usage: ${process.argv[2]} commandName subPackageName`)
}

const command = process.argv[2]
const subPackage = process.argv[3]
const fs   = require('fs')
const path = require('path')
const subPackageFileName = path.join(__dirname, '..', 'packages', subPackage, 'package.json')

if (!fs.existsSync(subPackageFileName)) {
  throw new Error(`No Lerna package found ${subPackage}`)
}

console.log(`Subpackage file at ${subPackageFileName}`)
const subPackageJSON = require(subPackageFileName)

const topScripts = topPackageJSON['scripts']
const subScripts = subPackageJSON['scripts']

if (process.argv[4] === 'rev') {
  if (!subScripts[command]) {
    throw new Error(`No sub-level script command ${command}`)
  }
  console.log(`Overwriting ${command} in top level package`)
  console.log(subScripts[command])

  topScripts[command] = subScripts[command]
  fs.writeFileSync(path.join(__dirname, '..', 'package.json'),
                   JSON.stringify(topPackageJSON, null, 2))
} else {
  if (!topScripts[command]) {
    throw new Error(`No top-level script command ${command}`)
  }
  console.log(`Overwriting ${command} in ${subPackage}`)
  console.log(topScripts[command])

  subScripts[command] = topScripts[command]
  fs.writeFileSync(subPackageFileName, JSON.stringify(subPackageJSON, null, 2))
}
