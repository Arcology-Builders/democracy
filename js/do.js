const fs = require('fs');
const { traverseDirs, ensureDir } = require('./utils')

const config = require('config')
const assert = require('assert')
const { List, Seq } = require('immutable')
const BN = require('bn.js')

/**
 * Validate dependencies then deploy the given contract output to a network.
 * @param eth network object connected to  provider
 * @param contractOutput the JSON compiled output to deploy
 */
async function dodo(eth, deploy, methodName, argMap) {
  const contractName = deploy.get('name')
  console.log(`Doing ${contractName}.${methodName} with args ${argMap.toJS()}`)
  const networkId = await eth.net_version() 
  const abi = deploy.get('abi').toJS()
  const deployAddress = deploy.get('deployAddress')

  const instance = eth.contract(abi).at(deployAddress)

  const argValues = List(argMap.values()).toJS()
  console.log(`Args '${argValues[0]}'`)
  if (!argValues || argValues[0] === undefined) {
    console.log("Zero args")
    instance[methodName]().then((...args) => {
      console.log(`Return Value ${JSON.stringify(args)}`)
    })
  } else {
    instance[methodName](...argValues).then((...args) => {
      console.log(`Return Value ${JSON.stringify(args)}`)
    })
  }
  /*
   * we will get a tx receipt for setter / mutator methods
   * and uncomment this later when we figure out how to handle it uniformly
  deployPromise = new Promise((resolve, reject) => {
    eth.contract(abi.toJS(), code,
      {from: deployerAddress, gas: "6700000", gasPrice: "0x21105b0"})
       .new(...ctorArgList).then((txHash) => {
        const checkTransaction = setInterval(() => {
          eth.getTransactionReceipt(txHash).then((receipt) => {
            if (receipt) {
	      clearInterval(checkTransaction)
	      resolve(receipt) 
            }
          })
        })
      }
    )
  })
  const minedContract = await deployPromise.then((receipt) => { return receipt })
  console.log(JSON.stringify(minedContract, null, "  "))
  */

}

module.exports = dodo
