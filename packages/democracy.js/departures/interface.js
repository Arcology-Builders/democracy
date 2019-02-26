require('module-alias/register')
const demo   = require('..')
const { Map, List } 
             = require('immutable')
const assert = require('chai').assert
const fs     = require('fs')

let compiles = List([])
let links    = List([])
let deploys  = List([])

// Globals shared by depart and clean
const eth = demo.getNetwork('test')

const depart = async () => {
  
  console.log("Departing now.")

  const networkId = await eth.net_version()
  
  {
    let contract = demo.getContract('TestInterface')
    if (!contract) {
      contract = await demo.compile('contracts', 'TestInterface.sol')
    }
    compiles = compiles.push(contract)
  }

  assert(fs.existsSync('./compiles/TestImpl.json'))

  {
    let contract = demo.getContract('TestUseInterface')
    if (!contract) {
      contract = await demo.compile('contracts', 'TestUseInterface.sol')
    }
    compiles = compiles.push(contract)
  }

  assert(fs.existsSync('./compiles/TestInterface.json'))

  let linkLib = demo.getLink(networkId, 'TestImpl-link')
  if (!linkLib) {
    linkLib = await demo.link('TestImpl', 'test', 'account0', 'link')
  }
  assert(demo.isLink(linkLib), `Object ${linkLib.toString()} is not a link.`) 
  links = links.push(linkLib)

  let deployLib = demo.getDeploy(networkId, 'TestImpl-deploy')
  if (!deployLib) {
    deployLib = await demo.deploy('TestImpl', 'test', 'link', 'deploy')
  }
  assert(demo.isDeploy(deployLib))
  deploys = deploys.push(deployLib)

  let linkUseIx = demo.getLink(networkId, 'TestUseInterface-link')
  if (!linkUseIx) {
    console.log("KABLAM")
    linkUseIx = await demo.link('TestUseInterface', 'test', 'account0', 'link', 'TestInterface=TestImpl-deploy')
  }
  assert(demo.isLink(linkUseIx))
  links = links.push(linkUseIx)
  
  let deployUseIx = demo.getDeploy(networkId, 'TestUseInterface-deploy')
  if (!deployUseIx) {
    deployUseIx = await demo.deploy( 'TestUseInterface', 'test', 'link', 'deploy', "_abc=123")
  }
  assert(demo.isDeploy(deployUseIx))
  deploys = deploys.push(deployUseIx)

  const linkList = List([linkLib, linkUseIx])
  const deployList = List([deployLib, deployUseIx])

  return {
    'links'    : Map(links.map((dep) => {
      return [`${dep.get('name')}-${dep.get('linkId')}`, dep]})),
    'deploys'  : Map(deploys.map((dep) => {
      return [`${dep.get('name')}-${dep.get('deployId')}`, dep]})),
    'compiles' : Map(compiles.map((con) => {
      return [con.get('name'), con] }))
  }
}

const clean = async() => {

  const networkId = await eth.net_version()

  // Disable cleaning compiles for now for speed
  // But any Solidity contract changes will need a manual re-compile.
  compiles.forEach(async (compile) => { await demo.cleanCompileSync(compile) })
  links.forEach(async (link) => { await demo.cleanLinkSync(networkId, link) })
  deploys.forEach(async (deploy) => { await demo.cleanDeploySync(networkId, deploy) } )
}

module.exports = {
  depart: depart,
  clean : clean
}
