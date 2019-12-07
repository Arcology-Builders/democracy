'use strict'
const { Map } = require('immutable')

const funcs = {}

funcs.departZkFunc = async function({
  compile,
  link,
  deployed,
  minedTx,
  tradeSymbol,
  canConvert,
  chainId
}) {
  
  const testERC20 = await deployed( 'TestERC20', {
    ctorArgList: Map({}),
    deployID: `deploy${tradeSymbol}`
  } )
  const aceContract = await deployed( 'ACE' )

  console.log('arguments', ...arguments)
  console.log('Trade Symbol', tradeSymbol)
  console.log('ACE Addresss', aceContract.address)
  console.log('TestERC20', testERC20.address)

  const pu = await deployed( 'ParamUtils' )
  await compile( 'TradeValidator', 'TradeValidator.sol' )
  await link( 'TradeValidator', 'link', Map({
    'ParamUtils' : 'deploy',
  }) )
  const tv = await deployed( 'TradeValidator',
    { ctorArgList: new Map({ _chainId: chainId, _aceAddress: aceContract.address }) })

  // initialise the private asset 
  await compile( 'ZkAssetTradeable', 'ZkAssetTradeable.sol' )
  await link( 'ZkAssetTradeable', 'link', Map({
    'ParamUtils' : 'deploy',
  }) )
  const zkAssetTradeable = await deployed(
    'ZkAssetTradeable',
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
