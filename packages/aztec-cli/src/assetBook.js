import React, {Component, Suspense, Fragment} from 'react'
import { unstable_createResource } from 'react-cache'
import { Map } from 'immutable'
import { LoginBook } from './login'
import { TokenRegistry } from './registry'
import { AddressBook } from './addressBook'
import { assert } from 'chai'
import { toJS, fromJS } from 'demo-utils'
const { getAztecPublicKey, deployed } = require('./utils')

const Fetcher = unstable_createResource(
  ({ address, password, wallet }) => wallet.prepareSignerEth({ address, password })
)

export const AssetBook = class extends Component {

  constructor(props) {
    super(props)
   
    this.initialAddress = localStorage.getItem(`demo/${this.props.chainId}/thisAddress`)
    this.initialPublicKey = getAztecPublicKey({
      address: this.initialAddress, wallet: this.props.wallet })
    this.initialPassword = localStorage.getItem(`demo/${this.props.chainId}/thisPassword`)

    this.state = {
     address   : this.initialAddress, 
     password  : this.initialPassword,
     publicKey : this.initialPublicKey,
     recipient : null,
     signerEth : null,
    } 

  }
  
  createFetcher_getBalance() {
    return unstable_createResource(
      (address) => this.props.eth.getBalance(address)
    )
  }

  getSignerEth() {
    const { address: newAddress, password: newPassword, signerEth } =
      Fetcher.read({
      address  : this.state.address,
      password : this.state.password,
      wallet   : this.props.wallet,
    })

    if (this.state.address !== newAddress) {
      this.setState({errorMessage: "Incorrect address / password combo."})
      return null
    }
    return signerEth
  }

  async setThisAccount({ address, password }) {
    const publicKey = getAztecPublicKey({ address, wallet: this.props.wallet })
    const validCombo = await this.props.wallet.validatePassword({ address, password })
    assert(validCombo, `Invalid address/password combo.`)
    const { address: newAddress, password: newPassword, signerEth }
      = await this.props.wallet.prepareSignerEth({
        address: address,
        password: password, 
      })
    assert.equal( newAddress, address,
                 `Prepared signer address is ${newAddress} instead of ${address}`)
    this.setState({ address, password, publicKey, signerEth })
  }

  setRecipient({ address, publicKey }) {
    this.setState({
      recipient : Map({address, publicKey})
    })
  }

  getThisAddress() {
    return this.state.address
  }

  getThisPassword() {
    return this.state.password
  }

  getThisPublicKey() {
    return this.state.publicKey
  }

  getRecipient() {
    return this.state.recipient
  }

  render() {
    const signerEth = this.state.signerEth // oh JS, and your runtime scoping of `this`
    const fetcher_getBalance = this.createFetcher_getBalance()
    return (
      <Fragment>
        <Suspense fallback={<div>Loading...</div>}>
          <div>

            <LoginBook
              wallet={this.props.wallet}
              chainId={this.props.chainId}
              getRecipient={() => this.getRecipient()}
              getBalance={(address) => fetcher_getBalance.read(address) }
              setThisAccount={(argsMap) => this.setThisAccount(argsMap)}
            />

            <AddressBook
              chainId          = {this.props.chainId}
              setRecipient     = {(argsMap) => this.setRecipient(argsMap)}
              initialAddress   = {this.initialAddress}
              initialPublicKey = {this.initialPublicKey}
            />

            <TokenRegistry
              zkTokens={this.props.zkTokens}
              bm={this.props.bm}
              chainId={this.props.chainId}
              wallet={this.props.wallet}
              signerEth={this.state.signerEth}
              thisAddressNotes={this.props.thisAddressNotes}
              deployed={ async (contractName, options) => {
                deployed({ contractName, options, bm: this.props.bm, signerEth })
              }}
              minedTx={ async (method, argList, options) => {
                console.log('MinedTx from address', this.state.address)
                const _options = Map({ from: this.state.address, gas: '6700000' })
                  .merge(options).toJS()
                console.log('_options', JSON.stringify(_options))
                // NOTE: We rely on `deployed` being called above to prepare the
                // associated signer.
                const signerEth = this.props.wallet.signersMap[this.state.address]
                console.log('deployerEth.address', JSON.stringify(_options))
                return await signerEth.getTransactionReceipt(
                  await method(...argList, _options) )
              }}
              parent={this}
              getThisAddress={ () => this.getThisAddress() }
              getThisPassword={ () => this.getThisPassword() }
              getThisPublicKey={ () => this.getThisPublicKey() }
              getRecipient={ () => this.getRecipient() }
            />

          </div>
        </Suspense>
    </Fragment>
    )
  }

}
