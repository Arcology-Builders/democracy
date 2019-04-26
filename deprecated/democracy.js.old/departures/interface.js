require('module-alias/register')
const demo   = require('..')
const { Map, List } 
             = require('immutable')
const assert = require('chai').assert
const fs     = require('fs')

let compiles = Map({})
let links    = List([])
let deploys  = List([])

// Globals shared by depart and clean
const eth = demo.getNetwork('test')

const depart = async () => {
  
  console.log("Departing now.")

  const networkId = await eth.net_version()
  
  {
    let contract = demo.getContract('TestImpl')
    let compileOutputs
    if (!contract) {
      compileOutputs = await demo.compile('contracts', 'TestInterface.sol')
      assert(compileOutputs)
      compiles = compiles.merge(compileOutputs)
      assert(demo.isCompile(compileOutputs))
      contract = compileOutputs.get('TestImpl')
    }
    assert(demo.isContract(contract))
  }

  assert(fs.existsSync('./compiles/TestImpl.json'))

  {
    let contract = demo.getContract('TestUseInterface')
    let compileOutputs
    if (!contract) {
      compileOutputs = await demo.compile('contracts', 'TestUseInterface.sol')
      assert(compileOutputs)
      compiles = compiles.merge(compileOutputs)
      assert(demo.isCompile(compileOutputs))
      contract = compileOutputs.get('TestUseInterface')
    }
    assert(demo.isContract(contract))
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
    'compiles' : Map(compiles.map((con, name) => {
      return [con.get('name'), con] }))
  }
}

const clean = async() => {

  console.log("Returning for cleanup.")
  const networkId = await eth.net_version()
  demo.cleanContractSync('TestImpl')
  demo.cleanContractSync('TestUserInterface')
  demo.cleanCompileSync(compiles)
  return Promise.all( [
    Promise.all( links.map(async (link) => {
      return await demo.cleanLinkSync(networkId, link)
    }).toJS()) ,
    Promise.all( deploys.map(async (deploy) => {
      return await demo.cleanDeploySync(networkId, deploy)
    }).toJS())
  ] )
  
}

module.exports = {
  depart: depart,
  clean : clean
}

if (require.main === module) {
  (async () => {
    await depart()
    await clean()
  })().then(() => { console.log() })
}
