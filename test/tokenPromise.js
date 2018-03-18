TestHarness2 = require('../js/testHarness')
testHarness2 = new TestHarness2('MintableToken')

TokenPromise = testHarness2.deployPromise().then((harness) => {
    return harness.runFunc((options, callback) => {
        harness.instance.mint(harness.accounts[1], 1e18, options, callback)
    })
})

module.exports = TokenPromise
