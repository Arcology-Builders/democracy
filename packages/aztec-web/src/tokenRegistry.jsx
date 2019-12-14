import React, { Suspense, Fragment } from 'react'
import { unstable_createResource } from 'react-cache'
import { Token } from './token'
import { List, Map } from 'immutable'

const Fetcher = unstable_createResource(async ({ownerAddress, chainId, bm}) => {
  const deploys = await bm.getDeploys()
  const securities   = deploys.filter((val, name) => name.match(/deploy[A-Z][A-Z][A-Z]/))
  const erc20Tokens  = securities.filter((val, name) => name.match(/ERC20/))
  const zkTokens     = securities.filter((val, name) => name.match(/ZkAssetMintable/))

	return new Map((await Promise.all(List(zkTokens.map(
		async (val, name) =>
			new Promise((resolve, reject) => {
				const address = val.get('deployAddress')
				bm.inputter(`zkNotes/${chainId}/${ownerAddress}/${address}`)
					.then(val => resolve([address, val]))
					.catch(e => resolve([address, Map({})]))
			})
	).values()).toJS())).values())
})

export class TokenRegistry extends React.Component {

  constructor(props) {
    super(props)
  }

  render() {
    const TokenClass = (this.props.tokenClass) ? this.props.tokenClass : Token
    const tokenRenders = List(this.props.zkTokens.map((value, name) => {
      return (
        <TokenClass
          key              = {name                                                        }
          bm               = {this.props.bm                                               }
          chainId          = {this.props.chainId                                          }
          signerEth        = {this.props.signerEth                                        }
          deployed         = {this.props.deployed                                         }
          minedTx          = {this.props.minedTx                                          }
          thisAddressNotes = {this.props.thisAddressNotes.get(value.get('deployAddress')) }
          name             = {name.split('-deploy')[1]                                    }
          type             = {name.split('-deploy')[0]                                    }
          deploy           = {value                                                       }
          address          = {value.get('deployAddress')                                  }
          notePath         = {`${this.props.parent.state.address}/${value.get('deployAddress')}`}
          getThisAddress   = {() => this.props.getThisAddress()                           }
          getThisPassword  = {() => this.props.getThisPassword()                          }
          getThisPublicKey = {() => this.props.getThisPublicKey()                         }
          wallet           = {this.props.wallet                                           }
          getRecipient     = {this.props.getRecipient                                     }
       /> 
      )
    }).values())
    return (
      <Fragment>
        <Suspense fallback={<div>Loading...</div>}>
          <div className="registryContainer">
            {tokenRenders}
          </div>
        </Suspense>
      </Fragment>
    )
  }

}
