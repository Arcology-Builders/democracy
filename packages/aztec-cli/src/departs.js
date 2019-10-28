'use strict'
const { Map } = require('immutable')

const funcs = {}

funcs.departZkFunc = async function({ deployed, minedTx, tradeSymbol, canConvert }) {
  
  const testERC20 = await deployed( 'TestERC20', {
    ctorArgList: Map({}),
    deployID: `deploy${tradeSymbol}`
  } )
  const aceContract = await deployed( 'ACE' )

  console.log('arguments', ...arguments)
  console.log('Trade Symbol', tradeSymbol)
  console.log('ACE Addresss', aceContract.address)
  console.log('TestERC20', testERC20.address)

  // initialise the private asset 
  const zkAssetMintable = await deployed(
    'ZkAssetMintable',
    { ctorArgList: new Map({
      _aceAddress: aceContract.address,
      _linkedTokenAddress: testERC20.address,
      _scalingFactor: 1,
      _canAdjustSupply: true,
      _canConvert: (canConvert !== false),
    }),
    deployID: `deploy${tradeSymbol}`
    }
  )

}

module.exports = funcs
