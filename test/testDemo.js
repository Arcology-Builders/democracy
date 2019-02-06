const demo = require('..')

const { Map } = require('immutable')

eth = demo.getNetwork('test')

main = async() => {
  await demo.compile(['contracts'], 'TestLibrary.sol')
  await demo.link('TestLibrary','test','account0','linkLib')
  await demo.deploy('TestLibrary','test','linkLib','deployLib','')

  await demo.link('TestUseLibrary','test','account0','linkBr','TestLibrary=deployLib')
  
  // Test both styles of constructor args, string and Map
  await demo.deploy('TestUseLibrary','test','linkBr','deployAAA','_abc=123')
  await demo.deploy('TestUseLibrary','test','linkBr','deployBBB', new Map({_abc: 123}))

  await demo.cleanCompile('TestLibrary')
  await demo.cleanLink(eth, 'TestLibrary-linkLib')
  await demo.cleanLink(eth, 'TestUseLibrary-linkBr')
  await demo.cleanDeploy(eth, 'TestLibrary-deployLib')
  await demo.cleanDeploy(eth, 'TestUseLibrary-deployAAA')
}

main().then(() => {})

