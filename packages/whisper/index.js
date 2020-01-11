require('@babel/polyfill')
const Web3 = require('web3')
// Our public whisper node at eth.arcology.nyc doesn't respond to hostname requests
const web3 = new Web3('ws://44.231.47.141:8546', {headers: {Origin: 'http://localhost:8080'}})

const DEFAULT_PASSWORD = "default"

const TTL = 20
const POW_TARGET = 2
const POW_TIME = 100

const msgContainer = document.getElementById('messages')
const errContainer = document.getElementById('errors')

const createDiv = (className, contents, parent) => {
  const newDiv = document.createElement('div')
  newDiv.setAttribute('class', className)
  newDiv.innerHTML = contents
  parent.appendChild(newDiv)
}

const ui = {
  addMessage: (sig, msg) => {
    const newRow = document.createElement('row')
    createDiv('message', msg, newRow)
    createDiv('sig', sig, newRow)
    msgContainer.appendChild(newRow)
  },
  addPrivateMessage: (sig, msg) => {
    const newRow = document.createElement('row')
    createDiv('privateMessage', msg, newRow)
    createDiv('sig', sig, newRow)
    msgContainer.appendChild(newRow)
  },
  addError: (err) => {
    createDiv('error', err, errContainer)
  }
}

const init = async () => {
  const keyId         = await web3.shh.newKeyPair()
  const publicKey     = await web3.shh.getPublicKey(keyId)
  const channelSymKey = await web3.shh.generateSymKeyFromPassword(DEFAULT_PASSWORD) 
  const channelTopic  = "0x11223344"
  
  web3.shh.subscribe("messages", {
    minPow  : POW_TARGET,
    symKeyID: channelSymKey,
    topics  : [channelTopic],
  }).on('data', (data) => {
    ui.addMessage(data.sig, web3.utils.toAscii(data.payload))
  }).on('error', (err) => {
    ui.addError("Couldn't decode message: " + err.message)
  })

  web3.shh.subscribe("messages", {
    minPow  : POW_TARGET,
    privateKeyID: keyId,
    topics  : [channelTopic],
  }).on('data', (data) => {
    ui.addPrivateMessage(data.sig, web3.utils.toAscii(data.payload))
  }).on('error', (err) => {
    ui.addError("Couldn't decode message: " + err.message)
  })

  const message="Hello world multicomputer"
  const sendPrivate = (msg, pubKey) => {
    web3.shh.post({
      pubKey   : pubKey,
      sig      : keyId,
      ttl      : 20,
      topic    : channelTopic,
      payload  : web3.utils.fromAscii(msg),
      powTime  : POW_TIME,
      powTarget: POW_TARGET,
    })
  }
  const sendPublic = (msg) => {
    web3.shh.post({
      symKeyID : channelSymKey,
      sig      : keyId,
      ttl      : 20,
      topic    : channelTopic,
      payload  : web3.utils.fromAscii(msg),
      powTime  : POW_TIME,
      powTarget: POW_TARGET,
    })
  }
  sendPublic(message)
  window.sendPublic = sendPublic
  window.sendPrivate = sendPrivate
}

init().then(() => { console.log("That's all folks") })
