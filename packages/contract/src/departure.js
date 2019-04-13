const { List } = require('immutable')
const demo = require('democracy.js')

const depart = (name, callback) => {

    let compiles = Map()
    const compile = async (contractName, sourceFile) => {
        const output = c.compile( sourceFile )
        let compiles = compiles.set(contractName, output)
    }

    let links = Map()
    const link = async (contractName, linkId, account) => {
        const output = c.link(  )
        let links = links.set(contractName, output)
    }

    let deploys = Map()
    const deploy = async (contractName, deployId, linkMap, force) => {
        const output = c.deploy( )
    }

    const clean = 

}