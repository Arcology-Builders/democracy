'use strict';

const readline = require('readline-sync');
const InvisibleLibrary = require('../src/invisible');
const demo = require('democracy.js')

let il 

const main = async() => {
  const eth = demo.getNetwork()
  const networkId = await eth.net_version()
  const deploy = demo.getDeploy(networkId, 'InvisibleLibrary-deploy')
  il = new InvisibleLibrary(eth, deploy)
}

main().then(() => {
  do {
    const photoURL    = readline.question('Enter photo URL: ')
    const shortDesc   = readline.question('Enter short description: ')
    const longDescURL = readline.question('Enter long description URL: ')
    il.postArtifact(photoURL, shortDesc, longDescURL)
    const repeat = readline.question("Enter another item? (y/n)").toUpperCase()
  } while (repeat !== 'n')
})

