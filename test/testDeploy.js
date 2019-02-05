const demo = require('..')

const assert = require('chai').assert

eth = demo.getNetwork('test')

describe('Democracy linking.', () => {
  it('should find a previously linked contract.', (done) => {
    main = async () => {
      await demo.compile('contracts', 'TestLibrary.sol')
      await demo.link('TestLibrary','test','account0','linkLib')
      const networkId = await eth.net_version()
      demo.getLink(networkId, "TestLibrary-linkLib")
      await demo.cleanCompile('TestLibrary')
      await demo.cleanLink(eth, 'TestLibrary-linkLib')
    }
    main().then(() => { done() })
    //done()
  })
})
