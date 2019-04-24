const Web3 = require('web3')
// Our public whisper node at eth.arcology.nyc doesn't respond to hostname requests
const web3 = new Web3('http://54.69.190.230:8545')

const DEFAULT_PASSWORD = "default"

const TTL = 20
const POW_TARGET = 2
const POW_TIME = 100

const msgContainer = document.getElementById('messages')
const errContainer = document.getElementById('errors')

const createDiv = (className, contents, parent) => {
  const newDiv = document.createElement('<div></div>')
  newDiv.setAttribute('class', className)
  newDiv.innerHTML = contents
  parent.appendChild(newDiv)
}

const ui = {
  addMessage: (sig, msg) => {
    const newRow = document.createElement('<row></row>')
    createDiv('message', msg, newRow)
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
  
  web3.shh.post({
    symKeyID : channelSymKey,
    sig      : keyId,
    ttl      : 20,
    topic    : channelTopic,
    payload  : web3.utils.fromAscii(message),
    powTime  : POW_TIME,
    powTarget: POW_TARGET,
  })

  web3.shh.subscribe("messages", {
    minPow  : POW_TARGET,
    symKeyID: channelSymKey,
    topics  : [channelTopic],
  }).on('data', (data) => {
    ui.addMessage(data.sig, web3.utils.toAscii(data.payload))
  }).on('error', (err) => {
    ui.addError("Couldn't decode message: " + err.message)
  })
}

init().then(() => { console.log("That's all folks") })
