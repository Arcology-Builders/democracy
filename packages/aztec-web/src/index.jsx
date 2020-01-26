import React from 'react'
import ReactDOM from 'react-dom'
import { getNetwork, toJS } from 'demo-utils'
import { wallet } from 'demo-keys'
import contract from 'demo-contract'
import { List, Map } from 'immutable'
import demoAztec from 'demo-aztec-lib'

import { AssetBook } from './assetBook'
import { AddressBook } from './addressBook'
import { LoginBook } from './loginBook'
import { Token } from './token'
import { TokenPlus } from './tokenPlus'
import { TokenRegistry } from './tokenRegistry'
import { Note } from './note'

const eth = getNetwork()
export const api = {}

// Use the demo parameter as it's been previously initialized
// Don't initialize the imported members above directly
// as these are a separate instance imported by webpack build
// within demo-aztec, as opposed to the one in the democracy bundle.
api.init = async (demo) => {

  const account = demo.secp256k1.accountFromPrivateKey(demo.keys.wallet.getAccountSync(demo.thisAddress).get('privatePrefixed'))
  demo.thisPublicKey = account.publicKey
  api.demo    = demo
  api.demoAztec   = demoAztec
  api.chainId = await eth.net_version()
  api.bm      = await demo.contract.createBM({chainId: api.chainId, autoConfig: true})
  api.deploys = await api.bm.getDeploys()
  api.ace     = (await demo.contract.createContract('ACE')).getInstance()

  const securities = api.deploys.filter((val, name) => name.match(/deploy[A-Z][A-Z][A-Z]/))
  api.erc20Tokens  = securities.filter((val, name) => name.match(/ERC20/))
  api.zkTokens     = securities.filter((val, name) => name.match(/ZkAssetTradeable/))

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

  ReactDOM.render(
    <AssetBook
      tokenClass       = {TokenPlus}
      zkTokens         = {api.zkTokens}
      ace              = {api.ace}
      bm               = {api.bm}
      chainId          = {api.chainId}
      eth              = {eth} // an eth that doesn't depend on login address
      wallet           = {demo.keys.wallet}
      contract         = {demo.contract}
      thisAddressNotes = {api.thisAddressNotes}
      gasLimit         = {demo.config.GAS_LIMIT}
    />,
    document.getElementById('root')
  )

}

export {
  AssetBook,
  AddressBook,
  LoginBook,
  Token,
  TokenRegistry,
  Note,
}

window.api = api
