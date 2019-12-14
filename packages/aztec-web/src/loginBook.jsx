import React, { Component, Suspense, Fragment } from 'react'
import { Map, List }    from 'immutable'
import { fromJS, toJS } from 'demo-utils'
import { toWei, fromWei } from 'ethjs-unit'
import { isValidChecksumAddress } from 'ethereumjs-util'

export class LoginBook extends Component {
  
  constructor(props) {
    super(props)

    const savedLoginString =
      localStorage.getItem(`demo/aztec/${this.props.chainId}/savedLogins`)
    const savedLogins = savedLoginString && savedLoginString !== '[]' ?
      fromJS ( JSON.parse(savedLoginString) ) : List([
        Map({
          address  : process.env.REACT_APP_DEPLOYER_ADDRESS,
          password : process.env.REACT_APP_DEPLOYER_PASSWORD,
        })
    ])
    const initialAddress  = localStorage.getItem(`demo/${this.props.chainId}/thisAddress`)
    const initialPassword = localStorage.getItem(`demo/${this.props.chainId}/thisPassword`)
     
    // We include the deployer account by default
    const hasSavedLogins = List.isList(savedLogins) && savedLogins.count() > 1
    this.state = {
      logins          : savedLogins,
      enteredAddress  : (hasSavedLogins) ? "" : initialAddress ,
      enteredPassword : (hasSavedLogins) ? "" : initialPassword,
      selectedAddress : (hasSavedLogins) ?  savedLogins.first() : this.props.initialAddress,
      payAmount       : '0',
      message         : "Initial cached account",
    }
    if (!hasSavedLogins) this.submitLogin()
   
  }

  updateAddress(evt) {
    this.setState({
      enteredAddress: evt.target.value
    })
  }

  updatePassword(evt) {
    this.setState({
      enteredPassword: evt.target.value
    })
  }

  updateAmount(evt) {
    this.setState({
      payAmount: evt.target.value
    })
  }

  async submitPay(evt) {
    await this.props.wallet.pay({
      weiValue : toWei(this.state.payAmount, 'ether').toString(),
      fromAddress : this.state.selectedAddress,
      toAddress : this.props.getRecipient().get('address'),
    })
  }

  async submitLogin(evt) {
    const validCombo = await this.props.wallet.validatePassword({
      address: this.state.enteredAddress, password: this.state.enteredPassword
    })

    if (!validCombo) {
      this.setState({
        message: "Incorrect or empty address/password combo"
      })
      return
    }
    
    const newAddress = this.state.enteredAddress
    const newPassword = this.state.enteredPassword

    const newPair = Map({
      address  : newAddress,
      password : newPassword,
    })
    const newLogins = this.state.logins.push(newPair)
    this.setState({
      logins          : newLogins,
      message         : "Additional account added.",
      enteredAddress  : "",
      enteredPassword : "",
    })
    const newLoginsString = JSON.stringify( toJS ( newLogins ) )
    localStorage.setItem(`demo/aztec/${this.props.chainId}/savedLogins`, newLoginsString)

    this.setThisAccount({ address: newAddress, password: newPassword })
  }

  setThisAccount({ address, password }) {
    this.props.setThisAccount({ address, password })
    this.setState({
      selectedAddress: address,
      message: "setThisAccount", 
    })
  }

  render() {
    return (
      <Fragment>
        <Suspense fallback={<div>Loading...</div>}>
      <section>
        <header>
          <h2>Login Book</h2>
        </header>
        <legend>
          Currently Logged In Address
        </legend>
        <div id="loggedInAddress" >
          {this.state.address}
        </div>
        <div id="loginMessage" >
          {this.state.message}
        </div>
        
        <ul style={{listStyle: 'none'}}>
          {this.state.logins.map(pair => {
            const selectedStyle = (pair.get('address') === this.state.selectedAddress) ?
              'loginSelected' : ''
            const balanceWei = isValidChecksumAddress(pair.get('address')) ?
              this.props.getBalance(pair.get('address')).toString() : '0'
            console.log('balanceWei', balanceWei)
            return (
              <li
                onClick={() => this.setThisAccount({
                  address  : pair.get('address'),
                  password : pair.get('password'),
                })}
                className="loginRow"
                style={{ listStyle: 'none' }}
                key={pair.get('address')}
              >
                <div className={"login loginAddress " + selectedStyle}>
                  {pair.get('address')}
                </div>
                <div className="login loginBalance">
                  {fromWei( balanceWei, 'ether' )}
                </div>
              </li>
            )}
          )}
        </ul>

        <div>
        <input
          type="text"
          className="login loginAddress"
          value={this.state.enteredAddress}
          onChange={evt => this.updateAddress(evt)}
        >
        </input>

        <input
          type="text"
          className="login loginPassword"
          value={this.state.enteredPassword}
          onChange={evt => this.updatePassword(evt)}
        >
        </input>

        <button
          id="loginSubmit"
          onClick={evt => this.submitLogin(evt)}
        >Retrieve Account
        </button>
        </div>

        <div>
        <input
          type="text"
          className="login loginBalance"
          value={this.state.payAmount}
          onChange={evt => this.updateAmount(evt)}
        >
        </input>
        <button
          id="paySubmit"
          onClick={evt => this.submitPay(evt)}
        >Pay ETH
        </button>
        </div>

      </section>
      </Suspense>
      </Fragment>
    )
  }
}
