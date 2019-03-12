const assert = require('chai').assert
const { toWei } = require('web3-utils')
const { getNetwork, getEndpointURL, print }
             = require('@democracy.js/utils') 
const keys   = require('../src/keys')
const BN     = require('bn.js')
const Wallet = require('../src/wallet')

// Set the network here
const eth = getNetwork('rinkeby')

const ADDRESSES = [
  'fe71c0139E28469dC44Df4B5bdf09B2a55E716C2',
  'B70747f6fc4FDFd10c8a024aa798F5B7FF7f0Fa0',
  '48c500d43DacddDAf6d2a968540E9D49b3F70AED',
  'b87cCb791bA2837fF88760934Ba987845E25d7af',
]

const PRIVATES = [
  '7C5A0D811947EADEEA3FD54B902C0F2A9A48E41AF3593A92D1AF646EF33099BB',
  '8D7608C3742AE1E7B40BEF9D276ED8A2542B14AD068B0AE1480F010FE8183E42',
  '7BD24636D6747B9E3A92332D9E0DCB36A85A83A106639DB5BBA4390B704C9ED5',
  '4DBE88D79BCACD8C3EE962213A58C67BAD17660AF2CF66F9891CE74CC6FCAC34',
]

const main = async () => {
  console.log("Rinkeby Balances")
  await Promise.all(ADDRESSES.map((addr) =>
    eth.getBalance(addr)
      .then((bal) => { return [addr, new BN(bal).toString(10)] })))
    .then((value) => { print(value) } )
  const accounts = PRIVATES.map((priv) => keys.createFromPrivateString(priv))

  const fromAddr = accounts[0].get('addressPrefixed')

  const RINKEBY_URL = getEndpointURL('rinkeby')
  console.log(`Rinkeby URL ${RINKEBY_URL}`)
  const ethSender = Wallet.createSignerEth(RINKEBY_URL, accounts[0])
  const txHash = await ethSender.sendTransaction(
    { value: toWei('1', 'ether'),
      data : "0x",
      from : fromAddr,
      to   : accounts[3].get('addressPrefixed'),
      nonce: await eth.getTransactionCount(fromAddr),
      gas  : 30000
    })

  assert(txHash)
  console.log(`txHash ${txHash}`)
  const tx = await eth.getTransactionByHash(txHash)
  const txReceipt = await eth.getTransactionReceipt(txHash)
  print(txReceipt)
  const gasValue = new BN(tx.gasPrice).mul(new BN(txReceipt.gasUsed))
  assert(txReceipt && txReceipt.transactionHash === txHash)

  return true
}


main().then((val) =>  console.log("That's all folks."))
