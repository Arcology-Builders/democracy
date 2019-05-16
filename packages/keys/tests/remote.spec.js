const { getDescribe } = require('./walletCommon')
const { getNetwork, Logger }  = require('demo-utils')
const { toWei }       = require('web3-utils')
const { wallet }      = require('demo-keys')

const LOGGER = new Logger('keys/remote.spec')

// These exists and were manually created on ganache.arcology.nyc
const DEPLOYER_ADDRESS  = '0x182830f0ae9b17ed50bffda8ee90de483d9c304f' 
const DEPLOYER_PASSWORD = '4808e517d74a32b875e33fdc04510f5b725cbbf7f39d968ee04820eebf7728ee' 

describe('Remote wallet store for accounts',
         getDescribe(wallet.init({autoConfig: true, unlockSeconds: 1})) )

describe('Create spender ETH from remote account', () => {

  let spenderEth
  let testAccounts
  let address
  let eth

  before(async () => {
    await wallet.init({ autoConfig: true, unlockSeconds: 1 })
    let { spenderEth: _spenderEth, address: _address } = await wallet.prepareSignerEth({
      autoCreate    : true,
    })
    spenderEth = _spenderEth
    address    = _address
    eth        = getNetwork()
    testAccounts = await eth.accounts()
  })
  
  it( 'Is able to send transactions from a spender account', async () => {
    await wallet.payTest({
      eth         : eth, 
      fromAddress : testAccounts[5],
      toAddress   : address,
      weiValue    : toWei('0.01', 'ether'),
      overage     : toWei('0.001', 'ether'),
    })
    await wallet.pay({
      fromAddress : address,
      toAddress   : testAccounts[5],
      payAll      : true,
      overage     : toWei('0.001', 'ether'),
    })
  })

})
