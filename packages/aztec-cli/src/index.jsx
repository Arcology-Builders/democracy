import React from 'react'
import ReactDOM from 'react-dom'
import { getNetwork, toJS } from 'demo-utils'
import { wallet } from 'demo-keys'
import contract from 'demo-contract'
import { List, Map } from 'immutable'
const utils = require('./utils')

const eth = getNetwork()
export const api = {}

// Use the demo parameter as it's been previously initialized
// Don't initialize the imported members above directly
// as these are a separate instance imported by webpack build
// within demo-aztec, as opposed to the one in the democracy bundle.
api.init = async (demo) => {

  const account = demo.secp256k1.accountFromPrivateKey(demo.keys.wallet.getAccountSync(demo.thisAddress, true).get('privatePrefixed'))
  demo.thisPublicKey = account.publicKey
  api.demo    = demo
  api.utils   = utils
  api.chainId = await eth.net_version()
  api.bm      = await demo.contract.createBM({chainId: api.chainId, autoConfig: true})
  api.deploys = await api.bm.getDeploys()
  api.ace     = (await demo.contract.createContract('ACE')).getInstance()

  const securities = api.deploys.filter((val, name) => name.match(/deploy[A-Z][A-Z][A-Z]/))
  api.erc20Tokens  = securities.filter((val, name) => name.match(/ERC20/))
  api.zkTokens     = securities.filter((val, name) => name.match(/ZkAssetMintable/))

  api.thisAddressNotes = new Map((await Promise.all(List(api.zkTokens.map(
    async (val, name) =>
      new Promise((resolve, reject) => {
        const address = val.get('deployAddress')
        api.bm.inputter(`zkNotes/${api.chainId}/${demo.thisAddress}/${address}`)
          .then(val => resolve([address, val]))
          .catch(e => resolve([address, Map({})]))
      })
  ).values()).toJS())).values())
                                                                                             
  console.log('thisAddressNotes', toJS( api.thisAddressNotes ))
  const contracts = {}

}

window.api = api
