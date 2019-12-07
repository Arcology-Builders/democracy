const BN         = require('bn.js')
const { parsed } = require('dotenv').config()
const { pt }     = require('./pt')
const { cx }     = require('./cx')
const { mint }   = require('./mint')
const { Map }    = require('immutable')

const { getConfig }       = require('demo-utils')

const SELLER_TRADE_SYMBOL = 'AAA'
const BUYER_TRADE_SYMBOL  = 'BBB'

const DEPLOYER_ADDRESS    = getConfig()['DEPLOYER_ADDRESS' ]
const DEPLOYER_PASSWORD   = getConfig()['DEPLOYER_PASSWORD']

const commons = {}

commons.SOURCE_PATH_LIST = [
  'contracts',
  '../../node_modules/demo-aztec-cli/contracts',
  '../../node_modules/@aztec/protocol/contracts',
]

let lastResult = Map({})

commons.getLastResult = () => lastResult

commons.doMintAmount = async ({
  amount,
  tradeSymbol      = 'AAA',
  minteeIndex      = 1,
  unlockSeconds    = 200,
  testAccountIndex = 3,
}) => { 
  const result = await mint(Map({
    tradeSymbol       : tradeSymbol,
    minteeAddress     : parsed[`TEST_ADDRESS_${minteeIndex}`   ],
    minteePublicKey   : parsed[`TEST_PUBLIC_KEY_${minteeIndex}`],
    minteeAmount      : amount,
    unlockSeconds,
    sourcePathList    : commons.SOURCE_PATH_LIST,
    testAccountIndex,
  }))
  lastResult = result
  return result.get('minteeNoteHash')
}

commons.doCxAmount = async ({
  amount,
  senderNoteHash,
  transferAll      = true,
  senderIndex      = 1,
  tradeSymbol      = 'AAA',
  testAccountIndex = 3,
}) => {
  const senderAddress   = parsed[`TEST_ADDRESS_${senderIndex}`   ]
  const senderPassword  = parsed[`TEST_PASSWORD_${senderIndex}`  ]
  const senderPublicKey = parsed[`TEST_PUBLIC_KEY_${senderIndex}`]

  lastResult = await cx(Map({
    unlabeled: Map({
      tradeSymbol,
      senderAddress,
      senderPassword,
      senderPublicKey,
      receiverAddress   : parsed['TEST_ADDRESS_1'],
      receiverPublicKey : parsed['TEST_PUBLIC_KEY_1'],
      senderNoteHash    : senderNoteHash,
      transferAmount    : new BN(amount),
      transferAll       : transferAll,
    }),
    unlockSeconds       : 500,
    testAccountIndex,
  }))
  return lastResult
}

commons.doPt = async ({
  sellerNoteHash,
  bidderNoteHash,
  _pt              = pt,
  sellerIndex      = 1,
  bidderIndex      = 2,
  testAccountIndex = 3,
}) => {
  const sellerAddress     = parsed[`TEST_ADDRESS_${sellerIndex}`     ]
  const sellerPassword    = parsed[`TEST_PASSWORD_${sellerIndex}`    ]
  const sellerPublicKey   = parsed[`TEST_PUBLIC_KEY_${sellerIndex}`  ]
  const bidderAddress     = parsed[`TEST_ADDRESS_${bidderIndex}`   ]
  const bidderPassword    = parsed[`TEST_PASSWORD_${bidderIndex}`  ]
  const bidderPublicKey   = parsed[`TEST_PUBLIC_KEY_${bidderIndex}`]
  lastResult = await _pt(Map({
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
    testAccountIndex,
    sourcePathList       : commons.SOURCE_PATH_LIST,
    unlockSeconds        : 80,
  }))
  return lastResult
}

module.exports = commons
