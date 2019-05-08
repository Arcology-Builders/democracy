require('@babel/polyfill')

const api = {}
api.utils = require('demo-utils')
const { Logger, getNetwork } = api.utils
const LOGGER = new Logger('keys')
const keys = require('..')
const { List, Map } = require('immutable')
const BN = require('bn.js')
const eth = getNetwork()

const assert = require('chai').assert
const account1 = keys.create()
const randombytes = require('randombytes')
const account2 = keys.createFromPrivateString(randombytes(32).toString('hex'))

let body

const appendDiv = (content, title, parent, contentClass, titleClass,
                   contentId, titleId, onclick) => {
  const row = document.createElement('row')
  const titleDiv = document.createElement('div')
  const contentDiv = document.createElement('div')
  contentDiv.innerHTML = content
  contentDiv.setAttribute('class', contentClass)
  contentDiv.setAttribute('id', contentId)
  contentDiv.onclick = onclick
  titleDiv.innerHTML = title
  titleDiv.setAttribute('class', titleClass)
  titleDiv.setAttribute('id', titleId)
  row.append(titleDiv)
  row.append(contentDiv)
  const _parent = (parent) ? (parent) : body
  _parent.append(row)
  return row
}

const timeAndDo = (funcCall, title) => {
  const startTime = Date.now()
  const result = funcCall()
  appendDiv(JSON.stringify(result), title)
  const endTime = Date.now()
  appendDiv(endTime - startTime, 'Elapsed Time')
  return result
}

const diagnosticTimes = () => {
  // Diagnostic info, encrypting / decrypting takes about 2 seconds
  const x = keys.accountToEncryptedJSON.bind(null, {account: account1, password: '2222'})

  const keyObj = timeAndDo( x, 'Encrypted JSON' )

  const y = keys.encryptedJSONToAccount.bind(null, {encryptedJSON: keyObj, password: '2222' })

  timeAndDo( y, 'Decrypted Account' )
}

const main = async () => {
  await keys.wallet.init({autoConfig: true, unlockSeconds: 10})
  const { address, password } = await keys.wallet.createEncryptedAccount()
  console.log(address, password)
  keys.testAccounts = await eth.accounts()
  const balances = await Promise.all(keys.testAccounts.map((a) => eth.getBalance(a)))
  /*
  await keys.wallet.payTest({fromAddress: keys.testAccounts[0], toAddress: address,
                            payAll: true})
                           */
}

// Constants
var ENDPOINT = api.utils.getEndpointURL()
var web3 = new Web3(new Web3.providers.HttpProvider(ENDPOINT));

// https://stackoverflow.com/a/8486188
function getJsonFromUrl() {
  var query = location.search.substr(1);
  var result = {};
  query.split("&").forEach(function(part) {
    var item = part.split("=");
    result[item[0]] = decodeURIComponent(item[1]);
  });
  return result;
}

function createBalanceDiv(balanceString) {
    var balanceDiv = document.createElement("div");
    balanceDiv.setAttribute("class", "metamaskBalance");
    balanceDiv.innerHTML = balanceString;
    return balanceDiv; 
}

function populateBalances(accountsList) {
  var provider = web3.currentProvider;
  var metamaskParent = document.getElementById("metamask");
  var confirmSelector = document.getElementById("confirmRequesterId");
  var approveSelector = document.getElementById("approveRequesterId");
  metamaskParent.setAttribute("style", "display: block;")
  for (var accounts = accountsList, i = 0; i < accountsList.length; i++) {
	  var address = accountsList[i];
    var rowDiv = document.createElement("div");
    rowDiv.setAttribute("class", "metamaskRow")
	  var accountDiv = document.createElement("div")
	  accountDiv.setAttribute("class", "metamaskAccount")
    var payButton = document.createElement('button')
    payButton.innerHTML = 'Empty Account'
    payButton.setAttribute('id', `pay-${i}`)
    payButton.setAttribute('class', 'payButton')
    payButton.onclick = async (evt) => {
      const id = evt.target.id
      console.log("Pay button ", id, "clicked")
      const recipient = document.getElementById('recipient')
      const i = id.split('-')[1]
      //document.getElementById(`address-${i}`).innerHTML = recipient.value
      document.getElementById(`recipient-${i}`).innerHTML = recipient.value
      const fromAddress = document.getElementById(`test-${i}`).innerHTML
      console.log('FROM ADDRESS', fromAddress)
      //  await api.getBalance(recipient.value)
      await keys.wallet.payTest({fromAddress: fromAddress, toAddress: recipient.value, payAll: true})
      console.log(recipient.value)
    }
    const recipient = document.createElement('div')
    recipient.setAttribute('id', `recipient-${i}`)
	  accountDiv.innerHTML = address
    accountDiv.setAttribute('id', `test-${i}`)
        rowDiv.appendChild(accountDiv);
        rowDiv.appendChild(createBalanceDiv(web3.fromWei(web3.eth.getBalance(address)).toString() + " ETH"));
        rowDiv.appendChild(payButton);
        rowDiv.appendChild(recipient);
        //rowDiv.appendChild(createBalanceDiv(web3.fromWei(tokenContract.balanceOf(address)).toString() + " SYM"));
        metamaskParent.appendChild(rowDiv);
    }
}

function updateBlockNumber() {
  document.getElementById("blockNumber").innerHTML = web3.eth.blockNumber;
}

window.addEventListener('load', function() {

  urlParams = getJsonFromUrl();

  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    populateBalances(web3.eth.accounts);
    // Use the browser's ethereum provider
  } else if (urlParams['net'] === 'ganache') {
    populateBalances(web3.eth.accounts);
  } else {
    console.log('No web3? You should consider trying MetaMask!')
  }
  updateBlockNumber();
  setInterval(updateBlockNumber, 15000);

  body = document.getElementsByTagName('body')[0]
  assert(body)
  diagnosticTimes()

  let idCounter = 0
  const createButton = document.getElementById('createButton')
  createButton.innerHTML = "Create New Account"
  createButton.onclick = async () => {
    const { address, password } = await keys.wallet.createEncryptedAccount() 
    const receiveButton = document.createElement('button')
    receiveButton.innerHTML = "Receive"
    receiveButton.onclick = (evt) => {
      document.getElementById('recipient').value = address
    }

    const row = appendDiv(`${password}`, `Address ${address}`,
              document.getElementById('accountsContainer'),
              'metamaskAccount', 'metamaskAccount',
              `address-${idCounter}`, `password-${idCounter}`)
    row.append(receiveButton)
    idCounter += 1
  }

})

keys.getBalance = eth.getBalance
main().then(() => console.log("That's all folks"))

window.api = { ...api, ...keys  }
