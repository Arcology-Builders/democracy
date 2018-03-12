var assert = require('assert')
describe('Array#indexOf()', function() {
  it('should return -1 when the value is not present', function(done) {
    assert.equal([1,2,3].indexOf(4), -1);
    done();
  });
});
