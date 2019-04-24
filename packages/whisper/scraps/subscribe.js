// Run this whisper tutorial to test programmatic subscription and receiving
// https://github.com/cryptogoth/whisper-tutorial
const Web3 = require('web3')

const web3 = new Web3(Web3.providers.WebsocketProvider('ws://localhost:8546',
                                                 {headers: {Origin: "mychat"}}))

const main = async () => {
  const keyID = await web3.shh.newKeyPair()
  console.log("KeyPair ID " + keyID)
  console.log("hasKeyPair " + await web3.shh.hasKeyPair(keyID))
  const publicKey = await web3.shh.getPublicKey(keyID)
  const channelSymKey = await web3.shh.generateSymKeyFromPassword("default")
  console.log("channel symkey " + channelSymKey)
  console.log("Public Key " + publicKey)
  return new Promise(async (resolve, reject) => {
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
}
main().then(() => { console.log("Press Ctrl+C to exit") })
