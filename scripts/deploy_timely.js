TimeHarness = require('../js/testHarness')
testHarness = new TimeHarness('TimelyResource')

const assert = require('assert')
const NAME = "Private Room in an Arcology"
const BPU = 1; // blocks per unit, for testing

var interval = undefined;

promise0 = testHarness.deployPromise().then((harness) => {
  head = harness.web3.eth.blockNumber + 10
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
.then((harness) => {
  //console.log(`Head ${harness.head}`)
  // Offset 0 (interval slot 1) is same as head
  interval = harness.instance.getInterval(harness.head)
  //console.log(`Interval ${JSON.stringify(interval)}`)
  assert.equal(harness.instance.getBits(), 1)
  return harness;
})
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

promise1 = Promise.all([promise0, tokenPromise]).then((values) => {
  timelyHarness = values[0]
  tokenHarness = values[1]
  return timelyHarness.runFunc((options, callback) => {
    options["from"] = timelyHarness.accounts[0]
    timelyHarness.instance.setTokenContract(tokenHarness.address, options, callback)
  })
});

promise1.then((harness) => {
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
    console.log(`${tokenHarness.address} === ${harness.instance.getTokenContract()}`)
    newAmt = 1e18 - interval[1]
    console.log(`New Amount ${newAmt}`)
    //console.log(tokenHarness.instance.balanceOf(harness.address))
    //console.log(tokenHarness.instance.balanceOf(harness.accounts[1]))
    //console.log(`Interval Amount ${interval[1]}`)
    console.log(`${tokenHarness.instance.balanceOf(harness.accounts[1])}`)
    assert(tokenHarness.instance.balanceOf(harness.accounts[1]).equals(newAmt),
      `Requester token balance is decremented by interval amount: ${newAmt}.`)
    return tokenHarness
  })
  .then((tokenHarness) => { 
    return tokenHarness.runFunc((options, callback) => {
      options["from"] = harness.accounts[1]
      tokenHarness.instance.increaseApproval(harness.address, parseInt(interval[1])+1, options, callback)
    }) 
  })
  .then((tokenHarness) => {
    console.log(`${tokenHarness.instance.allowance(harness.accounts[1], harness.address)}`)
    assert(tokenHarness.instance.allowance(harness.accounts[1], harness.address)
            .equals(interval[1]),
      `Requester token balance is decremented by interval amount: ${interval[1]}.`)
  })
  return harness;
})
.then((harness) => {
  return harness.runFunc((options, callback) => {
    // Test paying from same requester for now
    options["from"] = harness.accounts[1]
    harness.instance.checkTokenBalance(interval[1], options, callback); 
    harness.instance.checkTokenAllowance(interval[1], options, callback); 
    console.log(`${harness.instance.getBlocksPerUnit()}`)
    //harness.instance.practiceTransfer(5e17, options, callback);
    harness.instance.confirmInterval(0, options, callback)
  })
})
.then((harness) => {
  interval = harness.instance.getInterval(head)
  assert.equal(interval[0], 1, "Duration of 1")
  assert.equal(interval[1], 5e17, "Amount of 1")
  assert.equal(interval[2], 1, "Status of CONFIRMED")
})
