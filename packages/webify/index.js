const webifies = {}
//webifies.script = require('./src/webify')
//webifies.api = require('./exports/api')
const clientInit = async () => {
  await demo.initFS({})
  await demo.init({ unlockSeconds: 100000 }) // keep unlocked as long as we cache password
  await demo.prepareCachedWallet({})
  await demo.prepareErasePassword({
    erasePasswordSeconds: 100000, // 100,000 seconds is 27.77 hours
    erasePasswordCallback: () => { console.log("Erasing password") },
  })
  await demo.prepareUpdateWhileCached({
    updateSeconds: 10,
    updateCallback: (secondsLeft) => { console.log(`${secondsLeft} seconds left`) },
  })
  demo.chainId = await demo.eth.net_version()
  const thisPassword = localStorage.getItem(`demo/${demo.chainId}/thisPassword`)
  const { signerEth } = await demo.keys.wallet.prepareSignerEth({
    address: demo.thisAddress, password: thisPassword })
  demo.thisSignerEth = signerEth
  // Do ETHGarden-specific init here
}

module.exports = clientInit
