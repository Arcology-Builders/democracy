TimeHarness = require('../js/testHarness')
testHarness = new TimeHarness('TimelyResource')

const assert = require('assert')
const NAME = "Haircuts with Ramone"
const BPU = 200; // blocks per unit, about 40 minutes

promise0 = testHarness.deployPromise().then((harness) => {
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
// no need to verify the interval bits, did that in a previous test

describe("TestSuite TimelyResource Conflicting Multi Interval", () => {

  it('should fail to schedule a conflicting multi interval', function(done) {
    promise1 = promise0
    .then((harness) => {
      return harness.runFunc((options, callback) => {
        harness.instance.approveInterval(
                0, harness.accounts[1],
                7, 6e17,
                options, callback)
      })
    })
    .catch((error) => {
        assert(error,'Promise error');
        done();
      })

  })

  it('should still have the original amount', (done) => {
    promise1 = promise0.then((harness) => {
      // Offset 0 (interval slot 1) is same as head
      interval = harness.instance.getInterval(harness.head)
      assert.equal(harness.instance.getBits(), 1)
      assert.equal(interval[1], 5e17, "Interval should have original approved amount.")
      return harness;
    })

    promise1.then(() => { done() })
  })

  // Get a promise from our single deployed token
  TokenHarness = require('../js/testHarness')
  tokenHarness = new TokenHarness('MintableToken')

  tokenPromise = null;

  it('should mint initial tokens to account 1', function(done) {
    tokenPromise = tokenHarness.deployPromise().then((harness) => {
      return harness.runFunc((options, callback) => {
          harness.instance.mint(harness.accounts[2], 1e18, options, callback)
      })
    })
    .then((harness) => {
      assert.equal(harness.instance.balanceOf(harness.accounts[2]), 1e18)
      return harness
    })

    tokenPromise.then(() => { done() })
  })

  promise2 = null;

  it('should schedule a valid multi interval', (done) => {
    promise2 = promise1
    .then((harness) => {
      return harness.runFunc((options, callback) => {
        harness.instance.approveInterval(
          1, harness.accounts[2],
          7, 6e17,
          options, callback)
      })
    })
    .then((harness) => {
      assert.equal(harness.instance.getBits(), 1 + (((2**7)-1) << 1))
      interval = harness.instance.getInterval(harness.head + BPU)
      assert.equal(interval[1], 6e17, "Interval should have original approved amount.")
      return harness;
    })

    promise2.then(() => { done() })

  })

  promise3 = null;

  it('should not schedule a conflicting multi interval', (done) => {
    promise3 = promise2
    .then((harness) => {
      return harness.runFunc((options, callback) => {
        harness.instance.approveInterval(
          3, harness.accounts[2],
          7, 6e17,
          options, callback)
      })
    })
    .catch((error) => {
        assert(error,'This multi-interval conflicts with previous one.');
        done();
      })

  })

})
