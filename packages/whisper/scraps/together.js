// Run this with whisper tutorial from status to test posting programmatically
// http://github.com/cryptogoth/whisper-tutorial
const Web3 = require('web3')

const SHH_URL = (process.argv[2] === 'local') ?
  'ws://localhost:8546' : 'ws://eth.arcology.nyc:8546'
console.log(`SHH_URL ${SHH_URL}`)
// IP for eth.arcology.nyc 'ws://54.69.190.230:8546
const web3 = new Web3(
  Web3.providers.WebsocketProvider(SHH_URL, {headers: {Origin: "mychat"}}))

const main = async () => {
  const keyID = await web3.shh.newKeyPair()
  console.log("KeyPair ID " + keyID)
  console.log("hasKeyPair " + await web3.shh.hasKeyPair(keyID))
  const publicKey = await web3.shh.getPublicKey(keyID)
  const channelSymKey = await web3.shh.generateSymKeyFromPassword("default")
  console.log("channel symkey " + channelSymKey)
  console.log("Public Key " + publicKey)
  const msgHash = await web3.shh.post({
    symKeyID: channelSymKey,
    sig: keyID,
    ttl: 100,
    topic: "0x11223344",
    payload: web3.utils.fromAscii("hello"),
    powTime: 2,
    powTarget: 2,
  })
  console.log(msgHash)

  const subProm = new Promise(async (resolve, reject) => {
    const result = web3.shh.subscribe("messages", {
      minPow: 1,
      symKeyID: channelSymKey,
      topics: ["0x11223344"],
    }).on('data', (data) => {
      console.log(`Sig ${data.sig} msg ${web3.utils.toAscii(data.payload)}`)
      resolve(data)
    }).on('error', (err) => {
      console.error(`Error ${err}`)
      reject(err)
    })
    console.log(`Subscribe ID ${result.id}`)
    console.log(`Subscribe options ${JSON.stringify(result.options)}`)
  })

  const msgHash2 = await web3.shh.post({
    symKeyID: channelSymKey,
    sig: keyID,
    ttl: 100,
    topic: "0x11223344",
    payload: web3.utils.fromAscii("hola"),
    powTime: 2,
    powTarget: 2,
  })
  console.log(msgHash2)
 
}
main().then(() => { console.log("Press Ctrl+C to exit") })
