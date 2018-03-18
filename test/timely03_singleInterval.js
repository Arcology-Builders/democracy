TimeHarness = require('../js/testHarness')
testHarness = new TimeHarness('TimelyResource')

const assert = require('assert')
const NAME = "Haircuts with Ramone"
const BPU = 200; // blocks per unit, about 40 minutes

promise1 = null;

it('should schedule a single interval', function(done) {
  promise1 =
  testHarness.deployPromise().then((harness) => {
    head = harness.web3.eth.blockNumber + 86500
    harness.head = head
    assert.equal(typeof(head), "number")
    return harness.runFunc((options, callback) => {
      harness.instance.init(NAME, head, BPU, options, callback)
    })
  })
  .then((harness) => {
    return harness.runFunc((options, callback) => {
      harness.instance.approveInterval(
              0, harness.accounts[1],
              1, 5e17,
              options, callback)
    })
  })
  .then((harness) => {
    console.log(`Start ${harness.head}`)
    // Offset 0 (interval slot 1) is same as head
    interval = harness.instance.getInterval(harness.head)
    console.log(JSON.stringify(interval))
    assert.equal(harness.instance.getBits(), 1)
    return harness;
  })

  promise1.then(() => { done(); })
})

// Get a promise from our single deployed token
TokenPromise = require('./tokenPromise')

TokenPromise.then((harness) => {
  assert.equal(harness.instance.balanceOf(harness.accounts[1]), 1e18)
})

promise2 = null;

it('should update token address, precious', function(done) {
  TokenPromise.then((harness) => {
    return harness.address
  })
  .then((tokenAddr) => {
    promise2 = promise1.then((harness) => {
      return harness.runFunc((options, callback) => {
        options["from"] = harness.accounts[0]
        harness.instance.setTokenContract(tokenAddr, options, callback)
      })
    }).then((harness) => {
      assert.equal(harness.instance.tokenAddr(), tokenAddr)
      return harness;
    })
  })
  .then(() => { done(); })
})

promise3 = null;

it('should practice transferring half of your tokens', function(done) {
  promise3 = promise2.then((harness) => {
    TokenPromise.then((tokenHarness) => {
      return tokenHarness.runFunc((options, callback) => {
        options["from"] = harness.accounts[1]
        tokenHarness.instance.transfer(harness.address, interval[1], options, callback)
        done()
      })
    })
    return harness;
  })
})

it('should confirm and pay for an interval', function(done) {
  promise3.then((harness) => {
    return harness.runFunc((options, callback) => {
      // Test paying from same requester for now
      options["from"] = harness.accounts[1]
      interval = harness.instance.getInterval(harness.head)
      console.log(`Address: ${harness.address}`)
      console.log(JSON.stringify(interval))
      console.log(`Head ${harness.head}`)
      console.log(`Block Number ${harness.web3.eth.blockNumber}`)

      harness.instance.confirmInterval(harness.head,
        harness.accounts[1], options, callback)
    })
  })
  .then(() => { done() })
})
