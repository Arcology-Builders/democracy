TimeHarness = require('../js/testHarness')
testHarness = new TimeHarness('TimelyResource')

const assert = require('assert')
const NAME = "Haircuts with Ramone"
const BPU = 200; // blocks per unit, about 40 minutes

promise0 = testHarness.deployPromise().then((harness) => {
  head = harness.eth.blockNumber + 86500
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

describe("TestSuite TimelyResource Refunds", () => {

  // Get a promise from our single deployed token
  TokenHarness = require('../js/testHarness')
  tokenHarness = new TokenHarness('MintableToken')

  tokenPromise = null;

  it('should mint initial tokens to account 1', function(done) {
    tokenPromise = tokenHarness.deployPromise().then((harness) => {
      return harness.runFunc((options, callback) => {
          harness.instance.mint(harness.accounts[2], 1e18, options, callback)
      })
    })
    .then((harness) => {
      assert.equal(harness.instance.balanceOf(harness.accounts[2]), 1e18)
      console.log(harness.accounts[2])
      promise0.then((timelyHarness) => {
        return timelyHarness.runFunc((options, callback) => {
          timelyHarness.instance.setTokenContract(harness.address, options, callback)
        })
      })
      .then(() => { done() })
      return harness
    })
  })

  promise1 = null;

  it('should approve a valid multi interval and increase allowance', (done) => {
    promise1 = promise0
    .then((harness) => {
      assert.equal(harness.instance.getBits(), 1)
      interval = harness.instance.getInterval(harness.head)
      assert.equal(interval[2], 1, "Interval should have APPROVED status")
      //return harness;
      return harness.runFunc((options, callback) => {
        harness.instance.approveInterval(
          2, harness.accounts[0],
          7, 6e17,
          options, callback)
      })
    })
    .then((harness) => {
      assert.equal(harness.instance.getBits(), 1 + (((2**7)-1) << 2))
      return harness.runFunc((options, callback) => {
        harness.instance.approveInterval(
          55, harness.accounts[2],
          7, 6e17,
          options, callback)
      })
    })
    .then((harness) => {
      BigNumber = require('bignumber.js')
      mask = new BigNumber(2**7 - 1)
      expectedBits = new BigNumber(1).add(mask.mul(2**2)).add(mask.mul(2**55))
      assert.ok(harness.instance.getBits().equals(expectedBits))

      console.log(`${harness.head + 2*BPU}`)
      //assert.equal(harness.instance.getBits(), 1 + (((2**7)-1) << 2))
      console.log(harness.instance.getHead())
      interval = harness.instance.getInterval(harness.head + (BPU*55))
      assert.equal(interval[0], 7,
        `Interval should have original approved duration ${interval[0]}.`)
      assert.equal(interval[1], 6e17,
        `Interval should have original approved amount ${interval[1]}.`)

      assert.equal(interval[2], 1,
        "Interval should have APPROVED status.")
      console.log(harness.accounts[2])
      console.log(`Address ${harness.address}`)
      tokenPromise.then((tokenHarness) => {
        console.log(`Balance ${tokenHarness.instance.balanceOf(harness.accounts[2])}`)
        return tokenHarness.runFunc((options, callback) => {
          options['from'] = harness.accounts[2]
          tokenHarness.instance.approve(harness.address, interval[1], options, callback)
        })
      })
      .then((tokenHarness) => {
        allowance = tokenHarness.instance.allowance(harness.accounts[2], harness.address)
        assert.ok(tokenHarness.instance.balanceOf(harness.accounts[2]).equals(1e18))
        console.log(`Contract Address ${harness.address}`)
        console.log(`Source Address ${harness.accounts[2]}`)
        console.log(`Allowance ${allowance}`)
        console.log(`Interval Amount ${interval[1]}`)
        console.log(`Equal ${allowance.equals(interval[1])}`)
        assert.ok(allowance.equals(interval[1]),
          `Contract should be approved for ${interval[1]}`)
      })
      .then(() => { done() })

      return harness
    })

  })

  promise2 = null;

  it("should confirm a previously approved and allowed multi-interval", (done) =>{
    promise2 = promise1.then((harness) => {

      return harness.runFunc((options, callback) => {
        options['from'] = harness.accounts[2]
        harness.instance.confirmInterval(55,
          options, callback)
      })
    })
    .then((harness) => {
      console.log("Continued!")
      console.log(`${harness.instance.lastConfirmer()}`)
      console.log(`${harness.instance.lastConfirmBalance()}`)
      console.log(`${harness.instance.lastConfirmAllowance()}`)
      assert.equal(harness.instance.getBits(), 1 + (((2**7)-1) << 2) + (((2**7)-1) << 55))
      interval = harness.instance.getInterval(harness.head + BPU)
      assert.equal(interval[1], 6e17, "Interval should have original approved amount.")
      return harness;

    })
    .then((harness) => {
      interval = harness.instance.getInterval(harness.head + (BPU*55))
      assert.equals(interval[2], 2, "Should have CONFIRMED status.")
      tokenPromise.then((tokenHarness) => {
        assert.ok(tokenHarness.instance.balanceOf(harness.accounts[2]).equals(1e18 - 6e17))
        assert.ok(tokenHarness.instance.balanceOf(harness.address).equals(6e17))
        assert.ok(tokenHarness.instance.balanceOf(harness.accounts[0]).equals(6e17))
        done()
      })
      return this
    })

  })


  // it('should refund the previously confirmed multi-interval', (done) => {
  //   promise3 = promise2
  //   .then((harness) => {
    //   return harness.runFunc((options, callback) => {
    //     harness.instance.refundInterval(55,
    //       options, callback)
    //   })
    // })
    // .then((harness) => {
    //   assert.equal(harness.instance.getBits(), 1 + (((2**7)-1) << 1))
    //   interval = harness.instance.getInterval(harness.head + BPU)
    //   assert.equal(interval[1], 6e17, "Interval should have original approved amount.")
    //   assert.equal(interval[2], 5) // Should have Refunded status
    //   tokenPromise.then((tokenHarness) => {
    //     assert.equal(tokenHarness.instance.balanceOf(harness.accounts[2]), 1e18,
    //       "Requester should get tokens back up to original minted amount.")
    //     done()
    //   })
  //   })
  // })

})
