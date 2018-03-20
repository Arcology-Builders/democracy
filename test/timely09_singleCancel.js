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

describe("TestSuite TimelyResource Cancelling Single Interval", () => {

  it('should fail to cancel a non-existent single interval', function(done) {
    promise1 = promise0
    .then((harness) => {
      return harness.runFunc((options, callback) => {
        harness.instance.cancelInterval(
                harness.head.plus(122),
                options, callback)
      })
    })
    .catch((error) => {
        assert(error,"Revert because interval doesn't exist");
        done();
      })

  })

  it('should cancel the interval', function(done) {
    promise2 = promise0
    .then((harness) => {
      interval = harness.instance.getInterval(harness.head)
      assert.equal(harness.instance.getBits(), 1)
      assert.equal(interval[1], 5e17, "Interval should have original approved amount.")
      assert.equal(interval[2],  1, "Interval has APPROVED status")
      assert.equal(interval[0],  1, "Interval has duration one")
      console.log(`${JSON.stringify(interval)}`)
      console.log(`${harness.head}`)
      return harness.runFunc((options, callback) => {
        harness.instance.cancelInterval(
                87521,
                options, callback)
      })
    })
    .then((harness) => {
      assert.equal(harness.instance.getBits(), 0)
      interval = harness.instance.getInterval(harness.head)
      assert.equal(interval[1], 5e17, "Interval should have original approved amount.")
      assert.equal(interval[2],  1, "Interval has APPROVED status")
      assert.equal(interval[0],  1, "Interval has duration one")
    })
    .then(() => {done() })

  })

})
