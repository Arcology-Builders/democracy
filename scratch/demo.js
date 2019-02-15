const demo = require('..')

const { Map } = require('immutable')

let networkId

const cleanAll = (_networkId) => {
  demo.cleanCompileSync('TestLibrary')
  demo.cleanLinkSync(_networkId, 'TestLibrary-linkLib')
  demo.cleanLinkSync(_networkId, 'TestUseLibrary-linkBr')
  demo.cleanDeploySync(_networkId, 'TestLibrary-deployLib')
  demo.cleanDeploySync(_networkId, 'TestUseLibrary-deployAAA')
}
  
main = async() => {
  const eth = demo.getNetwork('test')
  networkId = await eth.net_version()
  cleanAll(networkId)
  await demo.compile('contracts', 'TestLibrary.sol')
  await demo.link('TestLibrary','test','account0','linkLib')
  await demo.deploy('TestLibrary','test','linkLib','deployLib','')

  await demo.link('TestUseLibrary','test','account0','linkBr','TestLibrary=deployLib')
  
  // Test both styles of constructor args, string and Map
  await demo.deploy('TestUseLibrary','test','linkBr','deployAAA','_abc=123')
  await demo.deploy('TestUseLibrary','test','linkBr','deployBBB', new Map({_abc: 123}))
  cleanAll(networkId)
}

main().then(() => {})

