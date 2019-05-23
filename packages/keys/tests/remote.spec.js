'use strict'
const { getDescribe } = require('./walletCommon')
const { getNetwork }  = require('demo-utils')
const { toWei }       = require('web3-utils')
const { wallet }      = require('demo-keys')

/*
describe('Local wallet store for accounts',
         getDescribe() )
*/
describe('Remote wallet store for accounts',
    getDescribe(wallet.init({autoConfig: true, unlockSeconds: 1})) )

describe('Create spender ETH from remote account', () => {

    let testAccounts
    let address
    let eth

    before(async () => {
        await wallet.init({ autoConfig: true, unlockSeconds: 1 })
        let { address: _address } = await wallet.prepareSignerEth({
            autoCreate    : true,
        })
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
