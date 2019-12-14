import React, { Component, Suspense, Fragment } from 'react'
import { List, Map } from 'immutable'
import { assert } from 'chai'
import BN from 'bn.js'
import { Note } from './note.js'

const { mintFunc } = require('./mintFunc')
const { cxFunc } = require('./cxFunc')

export class Token extends React.Component {
  
  constructor(props) {
    super(props)
    this.state = {
      notes: [],
      amount: 0,
      selectedNoteHash: '',
    }
  }

  updateMinteeAddress(evt) {
    this.setState({
      minteeAddress: evt.target.value
    })
  }

  updateMinteePublicKey(evt) {
    this.setState({
      minteePublicKey: evt.target.value
    })
  }

  updateMintAmount(evt) {
    this.setState({
      amount: evt.target.value
    })
  }

  setSelectedNote(noteHash) {
    assert.equal(noteHash.length, 66,
                 `Supposed note hash has length of ${noteHash.length} not 66`)
    this.setState({
      selectedNoteHash: noteHash
    })
  }

  render() {
    
    const noteRenders = List(
      this.props.thisAddressNotes.map((noteJSON, i) => {
        const noteHash = noteJSON.get('zkNoteHash')
        console.log('Note Hash', noteHash, noteJSON)
        const selectedStyle = (noteHash === this.state.selectedNoteHash) ?
          'noteSelected' : ''
        return (noteHash === 'mintTotal') ? '' :
          (
            <li
              style={{listStyle: 'none'}}
              className={'token ' + selectedStyle}
              onClick={() => this.setSelectedNote(noteHash)}
              >
            <Note
              key={noteHash}
              name={noteHash}
              noteJSON={noteJSON}
              className={selectedStyle}
            />
            </li>
          )
      }).values()
    )

    return (
      <Fragment>
        <Suspense callback={<div>Loading...</div>}>
      <div className="token">
        <header>{this.props.name}</header>
        <div className="tokenType">{this.props.type}</div>

        <input
          type="text"
          value={this.props.address}
          disable="true"
          className="tokenAddress"
          >
        </input>
        <br />

        <button
          className="mintButton"
          onClick={async () => {
            const recipient = this.props.getRecipient()
            console.log('recipient', recipient.toJS())
            await mintFunc(Map({
              bm              : this.props.parent.bm,
              chainId         : this.props.parent.chainId,
              deployed        : this.props.parent.deployed,
              minedTx         : this.props.parent.minedTx,
              deployerAddress : this.props.getThisAddress(),
              tradeSymbol     : this.props.name,
              minteeAddress   : recipient.get('address'),
              minteePublicKey : recipient.get('publicKey'),
              minteeAmount    : Number(this.state.amount),
              mintFromZero    : false,
            }))
          }}
          >
          Mint
        </button>

        <input
          type="text"
          value={this.state.amount}
          default="#"
          onChange={evt => this.updateMintAmount(evt)}
          width="10">
        </input> 

        <button
          className="cxButton"
          onClick={async () => {
            const recipient = this.props.getRecipient()
            console.log('recipient', recipient.toJS())
            await cxFunc(Map({
              bm                : this.props.bm,
              chainId           : this.props.chainId,
              deployed          : this.props.parent.deployed,
              minedTx           : this.props.parent.minedTx,
              deployerAddress   : recipient.get('address'),
              tradeSymbol       : this.props.name,
              senderAddress     : this.props.getThisAddress(),
              senderPublicKey   : this.props.getThisPublicKey(),
              senderPassword    : this.props.getThisPassword(),
              senderNoteHash    : this.state.selectedNoteHash,
              receiverAddress   : recipient.get('address'),
              receiverPublicKey : recipient.get('publicKey'),
              transferAmount    : Number(this.state.amount),
              wallet            : this.props.wallet,
            }))
          }}
          >
          Confidential Transfer
        </button>
        <ul>
          {noteRenders}
        </ul>

      </div>
      </Suspense>
      </Fragment>
    )
  }
}
