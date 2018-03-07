testHarness = new require('../js/testHarness')('TimelyResource')

const assert = require('assert')

it('should complete this test', function(done) {
  testHarness.then((instance) => {
    assert.equal(instance.tokenAddr(),
      "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359");
  })
  .then(() => {
    done();
  })
})
