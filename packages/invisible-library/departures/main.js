const demo   = require('democracy.js')
const { Compiler, isContract, isCompile } = require('@democracy.js/compile')
const { Map, List } 
             = require('immutable')
const assert = require('chai').assert
const fs     = require('fs')

let compiles = Map({})
let links    = List([])
let deploys  = List([])

// Globals shared by depart and clean
const eth = demo.getNetwork()

const depart = async () => {
  
  console.log("Departing now.")

  const networkId = await eth.net_version()
  const c = new Compiler('contracts')
  
  {
    let contract = c.getContract('InvisibleLibrary')
    if (!contract) {
      let compileOutputs 
      compileOutputs = await c.compile( 'InvisibleLibrary.sol' )
      assert(compileOutputs)
      compiles = compiles.merge(compileOutputs)
      assert(isCompile(compileOutputs))
      contract = compileOutputs.get('InvisibleLibrary')
    }
    assert(isContract(contract))
  }

  let linkLib = demo.getLink(networkId, 'InvisibleLibrary-link')
  if (!linkLib) {
    linkLib = await demo.link('InvisibleLibrary', networkId, 'account0', 'link')
  }
  assert(demo.isLink(linkLib), `Object ${linkLib.toString()} is not a link.`) 
  links = links.push(linkLib)

  let deployLib = demo.getDeploy(networkId, 'InvisibleLibrary-deploy')
  if (!deployLib) {
    deployLib = await demo.deploy('InvisibleLibrary', networkId, 'link', 'deploy')
  }
  assert(demo.isDeploy(deployLib))
  deploys = deploys.push(deployLib)

  const linkList = List([linkLib])
  const deployList = List([deployLib])

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
  c.cleanContractSync('InvisibleLibrary')
  c.cleanCompileSync(compiles)
  return Promise.all( [
    Promise.all( links.map(async (link) => {
      return await c.cleanLinkSync(networkId, link)
    }).toJS()) ,
    Promise.all( deploys.map(async (deploy) => {
      return await c.cleanDeploySync(networkId, deploy)
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
    if (process.argv[2] === 'clean') {
      await clean()
    }
  })().then(() => { console.log() })
}
