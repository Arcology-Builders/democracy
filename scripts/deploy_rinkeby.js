TimeHarness = require('../js/testHarness')
testHarness = new TimeHarness('TimelyResource')

const assert = require('assert')
const NAME = "Beds in an Arcology"
const BPU = 5760; // blocks per unit, 1 day
MI_START = null;

promise0 = null;

describe('Suite TimelyResource Multi-Interval Approving', () => {
  it('should deploy and init a contract', function(done) {
    promise0 =
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
                1, 1e17,
                options, callback)
      })
    })
    .then((harness) => {
      MI_START = harness.head + (BPU*MI_SHIFT);
      return harness.runFunc((options, callback) => {
        harness.instance.approveInterval(
                MI_SHIFT, harness.accounts[1],
                MI_DUR, 7e17,
                options, callback)
      })
    })
    .then((harness) => {
      //console.log(`Head ${harness.head}`)
      // Offset 0 (interval slot 1) is same as head
      interval = harness.instance.getInterval(MI_START)
      assert.equal(interval[2], 1)
      //console.log(`Interval ${JSON.stringify(interval)}`)
      assert.equal(harness.instance.getBits(), 1 + (MI_BITS<<MI_SHIFT))
      return harness;
    })

    promise0.then(() => { done(); })
  })

  /*
  it('should fail to schedule a multi interval past 256 slots into the future', function(done) {
    promise1 = promise0
    .then((harness) => {
      return harness.runFunc((options, callback) => {
        harness.instance.approveInterval(
                25600, harness.accounts[1],
                MI_DUR, 5e17,
                options, callback)
      })
    })
    .then((harness) => {
      console.log(`Start ${MI_START}`)
      // Offset 0 (interval slot 1) is same as head
      interval = harness.instance.getInterval(MI_START)
      console.log(JSON.stringify(interval))
      assert.equal(harness.instance.getBits(), 1 + (MI_BITS<<MI_SHIFT))
      return harness;
    })

    promise1.then(() => { done(); })
  })
  */

  // Get a promise from our single deployed token
  TokenHarness = require('../js/testHarness')
  tokenHarness = new TokenHarness('MintableToken')

  tokenPromise = null;

  it('should mint initial tokens to account 1', function(done) {
    tokenPromise = tokenHarness.deployPromise().then((harness) => {
      return harness.runFunc((options, callback) => {
          harness.instance.mint(harness.accounts[1], 1e18, options, callback)
      })
    })
    .then((harness) => {
      assert.equal(harness.instance.balanceOf(harness.accounts[1]), 1e18)
      return harness
    })

    tokenPromise.then(() => { done() })
  })

  promise2 = null;

  it('should update token address, precious', function(done) {
    tokenPromise.then((harness) => {
      return harness.address
    })
    .then((tokenAddr) => {
      promise2 = promise0.then((harness) => {
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

  it('should practice transferring of your tokens', function(done) {
    promise3 = promise2.then((harness) => {
      interval = harness.instance.getInterval(MI_START)
      assert.equal(interval[2], 1, "Status should be APPROVED")
      //console.log(JSON.stringify(interval))
      tokenPromise.then((tokenHarness) => {
        //console.log(tokenHarness.instance.balanceOf(harness.accounts[1]))
        return tokenHarness.runFunc((options, callback) => {
          options["from"] = harness.accounts[1]
          tokenHarness.instance.transfer(harness.address, interval[1], options, callback)
        })
      })
      .then((tokenHarness) => {
        assert(tokenHarness.instance.balanceOf(harness.address).equals(interval[1]),
          "Contract token balance is incremented by interval amount.")
        newAmt = 1e18 - interval[1]
        //console.log(tokenHarness.instance.balanceOf(harness.address))
        //console.log(tokenHarness.instance.balanceOf(harness.accounts[1]))
        assert(tokenHarness.instance.balanceOf(harness.accounts[1]).equals(newAmt),
          `Requester token balance is decremented by interval amount: ${newAmt}.`)
        return tokenHarness.runFunc((options, callback) => {
          options["from"] = harness.accounts[1]
          tokenHarness.instance.increaseApproval(harness.address, interval[1], options, callback)
        })
      })
      .then(() => { done() })
      return harness;
    })
  })

  it('should confirm and pay for a multi-interval', function(done) {
    promise3.then((harness) => {
      return harness.runFunc((options, callback) => {
        // Test paying from same requester for now
        options["from"] = harness.accounts[1]
        interval = harness.instance.getInterval(MI_START)
        //console.log(`Address: ${harness.address}`)
        //console.log(JSON.stringify(interval))
        //console.log(`Head ${harness.head}`)
        //console.log(`Block Number ${harness.web3.eth.blockNumber}`)

        harness.instance.confirmInterval(0,
          harness.accounts[1], options, callback)
      })
    })
    .then((harness) => {

    })
    .then(() => { done() })
  })

})
