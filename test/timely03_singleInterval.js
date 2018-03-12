testHarness = new require('../js/testHarness')('TimelyResource')

const assert = require('assert')
const NAME = "Haircuts with Ramone"
const BPU = 200; // blocks per unit, about 40 minutes

it('should schedule a single interval', function(done) {
  testHarness.then((harness) => {
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
              1, 2e18,
              options, callback)
    })
  })
  .then((harness) => {
    console.log(`Start ${harness.head}`)
    // Offset 0 (interval slot 1) is same as head
    interval = harness.instance.getInterval(harness.head)
    console.log(JSON.stringify(interval))
    assert.equal(harness.instance.getBits(), 1)
  })
  .then(() => {
    done();
  })
})
