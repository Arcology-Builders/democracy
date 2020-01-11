import React, { Component } from 'react'
import { List, Map } from 'immutable'
import { toChecksumAddress, publicToAddress } from 'ethereumjs-util'
import { fromJS, toJS } from 'demo-utils'

import { getAztecPublicKey } from 'demo-aztec-lib'

export class AddressBook extends Component {
  
  constructor(props) {
    super(props)
    
    const savedContactString =
      localStorage.getItem(`demo/aztec/${this.props.chainId}/savedContacts`)
    const savedContacts = savedContactString && savedContactString !== '[]' ?
      fromJS( JSON.parse(savedContactString) ) :
        List([
          Map({
            address   : process.env.REACT_APP_TEST_ADDRESS_4,
            publicKey : process.env.REACT_APP_TEST_PUBLIC_KEY_4,
          }),
          Map({
            address   : this.props.initialAddress,
            publicKey : this.props.initialPublicKey,
          }),
        ])
    if (!savedContactString) {
      const initialContactString = JSON.stringify( savedContacts.toJS() )
      localStorage.setItem(`demo/aztec/${this.props.chainId}/savedContacts`,
                          initialContactString)
    }

    this.state = {
      contacts         : savedContacts,
      currentAddress   : "",
      currentPublicKey : "",
      message          : "",
      selectedAddress  : "",
    }
  }

  updateAddress(evt) {
    this.setState({
      currentAddress: evt.target.value
    })
  }

  updatePublicKey(evt) {
    this.setState({
      currentPublicKey: evt.target.value
    })
  }

  async submitContact(evt) {
    const nonAztecPublicKey = '0x' + this.state.currentPublicKey.slice(4)
    const computedAddress = toChecksumAddress(
      publicToAddress( nonAztecPublicKey ).toString('hex')
    )
    if (computedAddress !== this.state.currentAddress) {
      this.setState({ message: "Address and public key don't match" })
      return
    }
    const newAddress   = this.state.currentAddress
    const newPublicKey = this.state.currentPublicKey

    const newPair = Map({
      address   : newAddress,
      publicKey : newPublicKey,
    })
    const newContacts = this.state.contacts.push(newPair)
    this.setState({
      contacts         : newContacts,
      currentAddress   : "",
      currentPublicKey : "",
    })
    const newContactsString = JSON.stringify( toJS ( newContacts ))
    
    localStorage.setItem(`demo/aztec/${this.props.chainId}/savedContacts`, newContactsString )
    this.setRecipient({
      address: newAddress,
      publicKey: newPublicKey,
    })
  }

  setRecipient({ address, publicKey }) {
    this.props.setRecipient({ address, publicKey })
    this.setState({ selectedAddress: address })
  }

  deleteContact( address ) {
    const updatedContacts = this.state.contacts.filter(pair => pair.get('address') !== address)
    console.log(`Deleting ${address} from ${updatedContacts.toJS()}`) 
    this.setState({ contacts: updatedContacts })
    const updatedContactsString = JSON.stringify( toJS ( updatedContacts ))
    localStorage.setItem(`demo/aztec/${this.props.chainId}/savedContacts`,
                         updatedContactsString )
  }

  render() {
    return (
      <section>
      <header>
        <h2>Address Book</h2>
      </header>
        <ul style={{listStyle: 'none'}}>
          <li className="contactRow">
            <div className="contact contactAddress">
              Contact Address
            </div>
            <div className="contact contactPublicKey">
              Contact Public Key
            </div>
          </li>
          {this.state.contacts.map(pair => {
            const selectedStyle = (pair.get('address') === this.state.selectedAddress) ?
              'contactSelected' : ''
            return (
            <li
              onClick={evt => this.setRecipient({
                address   : pair.get('address'),
                publicKey : pair.get('publicKey'),
              })}
              className="contactRow"
              style={{ listStyle: 'none' }}
              key={pair.get('address')}>
              <div className={"contact contactAddress " + selectedStyle}>
                {pair.get('address')}
              </div>
              <div className="contact contactPublicKey">
                {pair.get('publicKey')}
              </div>
              <button
                onClick={evt => this.deleteContact(pair.get('address'))}
                >Delete
              </button>
            </li>
          )})}
          <li className="contactRow">
            <input
              className="contactAddress"
              type="text"
              id="newAddress"
              width="50"
              value={this.state.currentAddress}
              onChange={evt => this.updateAddress(evt)}
            ></input>
            <input
              className="contactPublicKey"
              type="text"
              id="newPublicKey"
              width="100"
              value={this.state.currentPublicKey}
              onChange={evt => this.updatePublicKey(evt)}
            ></input>
          </li>
        </ul>
        <div id="message" >
          {this.state.message}
        </div>
        <div>
          <button
            id="contactSubmit"
            onClick={evt => this.submitContact(evt)}
          >Add Contact
          </button>
        </div>
      </section>
    )
  }
}
