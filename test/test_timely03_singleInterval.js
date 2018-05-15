TimeHarness = require('../js/testHarness')
testHarness = new TimeHarness('TimelyResource')

const assert = require('assert')
const NAME = "Haircuts with Ramone"
const BPU = 200; // blocks per unit, about 40 minutes

promise0 = null;

describe('Suite TimelyResource Single Interval Approving', () => {
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

    promise0.then(() => { done() })
  })

  promise1 = null;

  it('should schedule a single interval', function(done) {
    promise1 = promise0
    .then((harness) => {
      return harness.runFunc((options, callback) => {
        harness.instance.approveInterval(
                0, harness.accounts[1],
                1, 5e17,
                options, callback)
      })
    })
    .then((harness) => {
      //console.log(`Head ${harness.head}`)
      // Offset 0 (interval slot 1) is same as head
      interval = harness.instance.getInterval(harness.head)
      //console.log(`Interval ${JSON.stringify(interval)}`)
      assert.equal(harness.instance.getBits(), 1)
      return harness;
    })

    promise1.then(() => { done(); })
  })

  /*
  // TODO: Do typechecking on args, maybe a patch to web3js
  it('should fail to schedule a single interval past 256 slots into the future', function(done) {
    promise1 = promise0
    .then((harness) => {
      return harness.runFunc((options, callback) => {
        harness.instance.approveInterval(
                25600, harness.accounts[1],
                2, 5e17,
                options, callback)
      })
    })
    .then((harness) => {
      console.log(`Start ${harness.head}`)
      // Offset 0 (interval slot 1) is same as head
      interval = harness.instance.getInterval(harness.head)
      console.log(JSON.stringify(interval))
      assert.equal(harness.instance.getBits(), 1)
      return harness;
    })

    promise1.then(() => { done(); })
  })
  */


  // Get a promise from our single deployed token
  TokenHarness = require('../js/testHarness')
  tokenHarness = new TokenHarness('MintableToken')

  tokenPromise = tokenHarness.deployPromise().then((harness) => {
      return harness.runFunc((options, callback) => {
          harness.instance.mint(harness.accounts[1], 1e18, options, callback)
      })
  })
  .then((harness) => {
    assert.equal(harness.instance.balanceOf(harness.accounts[1]), 1e18)
    return harness
  })

  promise2 = null;

  it('should update token address, precious', function(done) {
    tokenPromise.then((harness) => {
      return harness.address
    })
    .then((tokenAddr) => {
      promise2 = promise1.then((harness) => {
        //console.log(`Promise1 ${harness.address}`)
        return harness.runFunc((options, callback) => {
          options["from"] = harness.accounts[0]
          harness.instance.setTokenContract(tokenAddr, options, callback)
        })
      })
      .then((harness) => {
        assert.equal(harness.instance.tokenAddr(), tokenAddr)
        return harness;
      })

      promise2.then(() => { done() })
    })

  })

  promise3 = null;

  it('should practice transferring half of your tokens', function(done) {
    promise3 = promise2.then((harness) => {
      //console.log(`Promise2 ${harness.address}`)
      interval = harness.instance.getInterval(harness.head)
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
        //console.log(`Interval Amount ${interval[1]}`)
        assert(tokenHarness.instance.balanceOf(harness.accounts[1]).equals(newAmt),
          `Requester token balance is decremented by interval amount: ${newAmt}.`)
        return tokenHarness
      })
      .then((tokenHarness) => { 
        return tokenHarness.runFunc((options, callback) => {
          options["from"] = harness.accounts[1]
          tokenHarness.instance.increaseApproval(harness.address, interval[1], options, callback)
        }) 
      })
      .then((tokenHarness) => {
        assert(tokenHarness.instance.allowance(harness.accounts[1], harness.address)
                .equals(interval[1]),
          `Requester token balance is decremented by interval amount: ${interval[1]}.`)
      })
      .then(() => { done() })
      return harness;
    })
  })

  promise4 = null;

  it('should confirm and pay for an interval', function(done) {
    promise4 = promise3.then((harness) => {
      return harness.runFunc((options, callback) => {
        // Test paying from same requester for now
        options["from"] = harness.accounts[1]
        interval = harness.instance.getInterval(harness.head)
        harness.instance.confirmInterval(0,
          options, callback)
      })
    })
    .then((harness) => {
      interval = harness.instance.getInterval(head)
      assert.equal(interval[0], 1, "Duration of 1")
      assert.equal(interval[1], 5e17, "Amount of 1")
      assert.equal(interval[2], 2, "Status of CONFIRMED")
    })

    promise4.then(() => { done() })
  })

})
