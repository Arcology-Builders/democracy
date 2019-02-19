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

describe("TestSuite TimelyResource Conflicting Single Interval", () => {

  it('should fail to schedule a conflicting single interval', function(done) {
    promise1 = promise0
    .then((harness) => {
      return harness.runFunc((options, callback) => {
        harness.instance.approveInterval(
                0, harness.accounts[1],
                1, 6e17,
                options, callback)
      })
    })
    .catch((error) => {
        assert(error,'Promise error');
        done();
      })

  })

  it('should still have the original amount', (done) => {
    promise0.then((harness) => {
      console.log(`Start ${harness.head}`)
      // Offset 0 (interval slot 1) is same as head
      interval = harness.instance.getInterval(harness.head)
      console.log(JSON.stringify(interval))
      assert.equal(harness.instance.getBits(), 1)
      assert.equal(interval[1], 5e17, "Interval should have original approved amount.")
      return harness;
    })
    .then(() => { done() })
  })

})
