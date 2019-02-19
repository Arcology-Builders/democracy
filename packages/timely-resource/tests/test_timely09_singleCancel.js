TimelyHarness = require('../js/testHarness')
testHarness = new TimelyHarness('TimelyResource')

const assert = require('assert')
const NAME = "Haircuts with Ramone"
const BPU = 200; // blocks per unit, about 40 minutes

// Get a promise from our single deployed token
TokenHarness = require('../js/testHarness')
tokenHarness = new TokenHarness('MintableToken')

tokenPromise = null;
tokenPromise = tokenHarness.deployPromise()
.then((harness) => {
  return harness.runFunc((options, callback) => {
      harness.instance.mint(harness.accounts[1], 1e18, options, callback)
  })
})
.then((harness) => {
  assert.equal(harness.instance.balanceOf(harness.accounts[1]), 1e18)
  return harness
})

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

promise1  = null;

describe("TestSuite TimelyResource Cancelling Single Interval", () => {

  it('should set a token address', (done) => {
    tokenPromise.then((harness) => {
      return harness.address
    })
    .then((tokenAddr) => {
      promise1 = promise0.then((harness) => {
        return harness.runFunc((options, callback) => {
          options["from"] = harness.accounts[0]
          harness.instance.setTokenContract(tokenAddr, options, callback)
        })
      }).then((harness) => {
        assert.equal(harness.instance.tokenAddr(), tokenAddr)
        return harness;
      })
    })
    .then(() => { done() })
  })

  promise2 = null;

  it('should fail to cancel a non-existent single interval', function(done) {
    promise2 = promise1
    .then((harness) => {
      return harness.runFunc((options, callback) => {
        harness.instance.cancelInterval(
                122,
                options, callback)
      })
    })
    .catch((error) => {
        assert(error,"Revert because interval doesn't exist");
        done();
      })

  })

  it('should still have an scheduled Interval', function(done) {
    promise2 = promise1
    .then((harness) => {
      interval = harness.instance.getInterval(harness.head)
      assert.equal(harness.instance.getBits(), 1)
      assert.equal(interval[1], 5e17, "Interval should have original approved amount.")
      assert.equal(interval[2],  1, "Interval has APPROVED status")
      assert.equal(interval[0],  1, "Interval has duration one")
    })
    .then(() => { done() })
  })

  it('should fail to cancel a single interval as another account', function(done) {
    promise2 = promise1
    .then((harness) => {
      return harness.runFunc((options, callback) => {
        options['from'] = harness.accounts[2]
        harness.instance.cancelInterval(
                0,
                options, callback)
      })
    })
    .catch((error) => {
        assert(error,"Revert because interval doesn't exist");
        done();
    })

  })

  it('should cancel the interval', function(done) {
    promise3 = promise1
    .then((harness) => {
      //console.log(`${JSON.stringify(interval)}`)
      //console.log(`${harness.head}`)
      return harness.runFunc((options, callback) => {
        harness.instance.cancelInterval(
                0,
                options, callback)
      })
    })
    .then((harness) => {
      assert.equal(harness.instance.getBits(), 0)
      interval = harness.instance.getInterval(harness.head)
    })
    .catch((error) => {
      assert(error, "Revert because interval is FREE again.")
      done()
    })

  })

})
