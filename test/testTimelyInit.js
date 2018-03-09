testHarness = new require('../js/testHarness')('TimelyResource')

const assert = require('assert')

it('should complete this test', function(done) {
  testHarness.then((harness) => {
    assert.equal(harness.instance.tokenAddr(),
      "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359");
    return harness.runFunc((options, callback) => {
      harness.instance.init("Haircuts With Ramone", 240, options, callback);
    });
  })
  .then((harness) => {
    console.log(JSON.stringify(harness));
    assert.equal(harness.instance.getBlocksPerUnit(), 240);
  })
  .then(() => {
    done();
  })
})
