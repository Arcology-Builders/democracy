TimeHarness = require('../js/testHarness')
testHarness = new TimeHarness('TimelyResource')

const assert = require('assert')
const NAME = "Haircuts with Ramone"
const BPU = 200; // blocks per unit, about 40 minutes

it('should complete this test', function(done) {
  testHarness.deployPromise().then((harness) => {
    assert.equal(harness.instance.tokenAddr(),
      "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359");
    // Initialize schedule ahead of deploy time, with buffer of 100 blocks
    head = harness.web3.eth.blockNumber + 86500
    assert.equal(typeof(head), "number")
    return harness.runFunc((options, callback) => {
      harness.instance.init(NAME, head, BPU, options, callback);
    });
  })
  .then((harness) => {
    assert.equal(harness.instance.getBlocksPerUnit(), BPU);
    assert.equal(harness.instance.name(), NAME);
  })
  .then(() => {
    done();
  })
})
