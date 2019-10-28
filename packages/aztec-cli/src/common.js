const { parsed } = require('dotenv').config()
const { pt }     = require('./pt')
const { mint }   = require('./mint')
const { Map }    = require('immutable')

const { getConfig } = require('demo-utils')

const SELLER_TRADE_SYMBOL = 'AAA'
const BUYER_TRADE_SYMBOL  = 'BBB'

const DEPLOYER_ADDRESS  = getConfig()['DEPLOYER_ADDRESS' ]
const DEPLOYER_PASSWORD = getConfig()['DEPLOYER_PASSWORD']

const commons = {}

commons.SOURCE_PATH_LIST = [
  'contracts',
  '../../node_modules/demo-aztec-cli/contracts',
  '../../node_modules/@aztec/protocol/contracts',
]

commons.doMintAmount = async ({
  amount,
  tradeSymbol    = 'AAA',
  minteeIndex    = 1,
  unlockSeconds  = 200,
}) => { 
  const result = await mint(Map({
    tradeSymbol     : tradeSymbol,
    minteeAddress   : parsed[`TEST_ADDRESS_${minteeIndex}`   ],
    minteePublicKey : parsed[`TEST_PUBLIC_KEY_${minteeIndex}`],
    minteeAmount    : amount,
    unlockSeconds,
    sourcePathList  : commons.SOURCE_PATH_LIST,
  }))
  return result.get('minteeNoteHash')
}

commons.doPt = async ({
  sellerNoteHash,
  bidderNoteHash,
  _pt         =pt,
  sellerIndex =1,
  bidderIndex =2,
}) => {
  const sellerAddress     = parsed[`TEST_ADDRESS_${sellerIndex}`     ]
  const sellerPassword    = parsed[`TEST_PASSWORD_${sellerIndex}`    ]
  const sellerPublicKey   = parsed[`TEST_PUBLIC_KEY_${sellerIndex}`  ]
  const bidderAddress     = parsed[`TEST_ADDRESS_${bidderIndex}`   ]
  const bidderPassword    = parsed[`TEST_PASSWORD_${bidderIndex}`  ]
  const bidderPublicKey   = parsed[`TEST_PUBLIC_KEY_${bidderIndex}`]
  return result = await _pt(Map({
    seller: Map({
      tradeSymbol       : SELLER_TRADE_SYMBOL,
      address     : sellerAddress      ,
      password    : sellerPassword     ,
      publicKey   : sellerPublicKey    ,
      noteHash    : sellerNoteHash     ,
    }),
    bidder : Map({
      tradeSymbol       : BUYER_TRADE_SYMBOL ,
      address     : bidderAddress      ,
      password    : bidderPassword     ,
      publicKey   : bidderPublicKey    ,
      noteHash    : bidderNoteHash     ,
    }),
    testValueETH         : '0.2',
    sourcePathList       : commons.SOURCE_PATH_LIST,
    unlockSeconds        : 80,
  }))
}

module.exports = commons
