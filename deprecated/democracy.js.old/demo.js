#!/usr/bin/env node
// demo.js, the entry point for Democracy, an undiscovered decentralized country

const { List } = require('immutable')
const lib = require('./src/lib')

// Do the thing
lib.demo(List(process.argv)).then(() => { })
