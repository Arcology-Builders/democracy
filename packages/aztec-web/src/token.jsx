import React, { Component, Suspense, Fragment } from 'react'
import { List, Map } from 'immutable'
import { assert } from 'chai'
import BN from 'bn.js'
import { Note } from './note'
import { constructCxPipeline, constructMintPipeline }
  from 'demo-aztec-lib'
import { runTransforms } from 'demo-transform'

const cxPipeline = constructCxPipeline()
const mintPipeline = constructMintPipeline()

const cx = async (state) => {
  return await runTransforms( cxPipeline, state )
}

const mint = async (state) => {
  return await runTransforms( mintPipeline, state )
}

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

  setSelectedNote(noteHash, noteValue) {
    assert.equal(noteHash.length, 66,
                 `Supposed note hash has length of ${noteHash.length} not 66`)
    assert.typeOf(noteValue, 'String')
    this.setState({
      selectedNoteHash  : noteHash,
      selectedNoteValue : noteValue,
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
              >
            <Note
              key={noteHash}
              name={noteHash}
              noteJSON={noteJSON}
              className={selectedStyle}
              setSelectedNote={(noteValue) => this.setSelectedNote(noteHash, noteValue)}
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
            await mint(Map({
              bm              : this.props.bm,
              chainId         : this.props.chainId,
              deployerEth     : this.props.signerEth,
              deployed        : this.props.deployed,
              minedTx         : this.props.minedTx,
              deployerAddress : this.props.getThisAddress(),
              deployerPassword : this.props.getThisPassword(),
              tradeSymbol     : this.props.name,
              minteeAddress   : recipient.get('address'),
              minteePublicKey : recipient.get('publicKey'),
              minteeAmount    : new BN(this.state.amount),
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
            const argMap = Map({
              bm                : this.props.bm,
              chainId           : this.props.chainId,
              signerEth         : this.props.signerEth,
              deployed          : this.props.deployed,
              minedTx           : this.props.minedTx,
              deployerAddress   : this.props.getThisAddress(),
              deployerPassword  : this.props.getThisPassword(),
              tradeSymbol       : this.props.name,
              senderAddress     : this.props.getThisAddress(),
              senderPublicKey   : this.props.getThisPublicKey(),
              senderPassword    : this.props.getThisPassword(),
              senderNoteHash    : this.state.selectedNoteHash,
              receiverAddress   : recipient.get('address'),
              receiverPublicKey : recipient.get('publicKey'),
              transfererAddress : this.props.getThisAddress(),
              transferFunc      : async (token, proofData, signatures) => {
                  return await this.props.minedTx( token.confidentialTransfer, [proofData, signatures ] )
              },
              transferAmount    : new BN(this.state.amount),
              wallet            : this.props.wallet,
            })
            await cx(argMap)
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
