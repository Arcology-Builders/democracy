require('module-alias/register')
const demo   = require('..')
const { Map, List } 
             = require('immutable')
const assert = require('chai').assert

let compiles = List([])
let links    = List([])
let deploys  = List([])

// Globals shared by depart and clean
const eth = demo.getNetwork('test')

const depart = async () => {

  const networkId = await eth.net_version()

  compiles = compiles.push('TestLibrary')
  if (!demo.getContract('TestLibrary')) {
    await demo.compile('contracts', 'TestLibrary.sol')
  }

  compiles = compiles.push('TestLibrary2')
  if (!demo.getContract('TestLibrary2')) {
    await demo.compile('contracts', 'TestLibrary2.sol')
  }

  compiles = compiles.push('TestUseLibrary2')
  if (!demo.getContract('TestUseLibrary2')) {
    await demo.compile('contracts', 'TestUseLibrary2.sol')
  }

  let linkLib = demo.getLink(networkId, 'TestLibrary-link')
  if (!linkLib) {
    linkLib = await demo.link('TestLibrary', 'test', 'account0', 'link')
  }
  assert(demo.isLink(linkLib), `Object ${linkLib.toString()} is not a link.`) 
  links = links.push('TestLibrary-link')

  let linkLib2 = demo.getLink(networkId, 'TestLibrary2-link')
  if (!linkLib2) {
    linkLib2 = await demo.link('TestLibrary2', 'test', 'account0', 'link')
  }
  assert(demo.isLink(linkLib2))
  links = links.push('TestLibrary2-link')

  let deployLib = demo.getDeploy(networkId, 'TestLibrary-deploy')
  if (!deployLib) {
    deployLib = await demo.deploy('TestLibrary', 'test', 'link', 'deploy')
  }
  assert(demo.isDeploy(deployLib))
  deploys = deploys.push('TestLibrary-deploy')

  let deployLib2 = demo.getDeploy(networkId, 'TestLibrary2-deploy')
  if (!deployLib2) {
    deployLib2 = await demo.deploy('TestLibrary2', 'test', 'link', 'deploy')
  }
  assert(demo.isDeploy(deployLib2))
  deploys = deploys.push('TestLibrary2-deploy')

  let linkUseLib = demo.getLink(networkId, 'TestUseLibrary2-link')
  if (!linkUseLib) {
    linkUseLib = await demo.link('TestUseLibrary2', 'test', 'account0', 'link', 'TestLibrary=deploy', 'TestLibrary2=deploy')
  }
  assert(demo.isLink(linkUseLib))
  links = links.push('TestUseLibrary2-link')
  
  let deployUseLib = demo.getDeploy(networkId, 'TestUseLibrary2-deploy')
  if (!deployUseLib) {
    deployUseLib = await demo.deploy( 'TestUseLibrary2', 'test', 'link', 'deploy', "_abc=123")
  }
  assert(demo.isDeploy(deployUseLib))
  deploys = deploys.push('TestUseLibrary2')

  const linkList = List([linkLib, linkLib2, linkUseLib])
  const deployList = List([deployLib, deployLib2, deployUseLib])

  return {
    'links'  : Map(linkList.map((dep) => {return [`${dep.get('name')}-${dep.get('linkId')}`, dep]})),
    'deploys': Map(deployList.map((dep) => {return [`${dep.get('name')}-${dep.get('deployId')}`, dep]})),
  }
}

const clean = async() => {

  const networkId = await eth.net_version()

  // Disable cleaning compiles for now for speed
  // But any Solidity contract changes will need a manual re-compile.
  //compiles = List(['TestLibrary', 'TestLibrary2', 'TestUseLibrary2'])
  compiles.forEach(async (compile) => { await demo.cleanCompileSync(compile) })
  links.forEach(async (link) => { await demo.cleanLinkSync(networkId, link) })
  deploys.forEach(async (deploy) => { await demo.cleanDeploySync(networkId, deploy) } )
}

module.exports = {
  depart: depart,
  clean : clean
}
