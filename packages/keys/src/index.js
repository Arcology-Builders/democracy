require('@babel/polyfill')

const { Logger, getNetwork } = require('demo-utils')
const LOGGER = new Logger('keys')
const keys = require('..')
const { List, Map } = require('immutable')
const BN = require('bn.js')
const eth = getNetwork()
new Map(keys).map((v, k) => { console.log("key", k, typeof(v)) })

const assert = require('chai').assert
const account1 = keys.create()
const randombytes = require('randombytes')
const account2 = keys.createFromPrivateString(randombytes(32).toString('hex'))

const body = document.getElementsByTagName('body')
assert(body.length == 1)
const accountString = JSON.stringify(account1.toJS(), null, '  ')

const appendDiv = (content, title) => {
  const row = document.createElement('row')
  const titleDiv = document.createElement('div')
  const contentDiv = document.createElement('div')
  contentDiv.innerHTML = content
  titleDiv.innerHTML = title
  row.append(titleDiv)
  row.append(contentDiv)
  body[0].append(row)
}

const timeAndDo = (funcCall, title) => {
  const startTime = Date.now()
  const result = funcCall()
  appendDiv(JSON.stringify(result), title)
  const endTime = Date.now()
  appendDiv(endTime - startTime, 'Elapsed Time')
  return result
}

console.log(`Account ${accountString}`)
appendDiv(accountString)

const x = keys.accountToEncryptedJSON.bind(null, account1, '2222')

const keyObj = timeAndDo( x, 'Encrypted JSON' )

const y = keys.encryptedJSONToAccount.bind(null, keyObj, '2222')

timeAndDo( y, 'Decrypted Account' )

const main = async () => {
  await keys.wallet.init({autoConfig: true, unlockSeconds: 10})
  const { address, password } = await keys.wallet.createEncryptedAccount()
  console.log(address, password)
  keys.testAccounts = await eth.accounts()
  const balances = await Promise.all(keys.testAccounts.map((a) => eth.getBalance(a)))
  await keys.wallet.pay({fromAddress: keys.testAccounts[0], toAddress: address, weiValue: new BN(balances[0]) - new BN('1960000000000000')})
}

keys.getBalance = eth.getBalance
main().then(() => console.log("That's all folks"))

window.api = keys 
