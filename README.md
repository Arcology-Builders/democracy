democracy
=========

Minimalist tools for running a distributed country, currently on Ethereum.

This is a [lerna](http://lernajs.org)-managed monorepo.

You can include the top-level npm package `democracy.js` or just include the sub-packages you need.

[![npm version](https://badge.fury.io/js/democracy.js.svg)](https://badge.fury.io/js/democracy.js) `democracy.js` our main framework package, built on `ethjs`

[![npm version](https://badge.fury.io/js/demo-utils.svg)](https://badge.fury.io/js/demo-utils) `demo-utils` a browser-friendly key/value store and functions for managing build outputs / dependencies

[![npm version](https://badge.fury.io/js/demo-keys.svg)](https://badge.fury.io/js/demo-keys) `demo-keys` key management, using the wonderful `keythereum`.

[![npm version](https://badge.fury.io/js/demo-contract.svg)](https://badge.fury.io/js/demo-contract) `demo-contract` contract building, linking, and deploying, possibly remotely.

[![npm version](https://badge.fury.io/js/demo-rest.svg)](https://badge.fury.io/js/demo-rest) `demo-rest` a simple REST server and client for remote key-value storage, useful for browser-only dapps so you don't need to webpack in your ABIs / contract addresses like a Neanderthal (no offense, Neanderthals).

[![npm version](https://badge.fury.io/js/demo-compile.svg)](https://badge.fury.io/js/demo-compile) `demo-compile` it's sad but true, the compiler is the least cool module because Solidity, but it's still very necessary.

[![CircleCI](https://circleci.com/gh/invisible-college/democracy.svg?style=svg)](https://circleci.com/gh/invisible-college/democracy)

## Install with npm

```
npm i democracy.js
```

Then in your modules

```
const demo = require('democracy.js')
```

## Get the Source Code to Play Around and Run Tests

Clone our git repo locally
```
git clone https://github.com:invisible-college/democracy
```

We manage a monorepo of multiple packages with `lerna`.
You can build and test them all at once.
```
cd democracy
lerna bootstrap
lerna run test
```

# Where Are We Going?

Curious about what a future democracy holds? Us too!

Check out our current [RoadMap](./docs/RoadMap.md)

## REPL

To experiment with and administer Ethereum contracts, it's useful to have a central
console able to attach to any JSONRPC endpoint, whether it's on the mainnet or one
of the public testnets (Ropsten, Kovan, Rinkeby).

An example session looks like
```
NODE_ENV=TEST node
> demo = require('demo.js')
> eth = demo.getNetwork()       # you'll hit our public node at http://ganache.arcology.nyc
> eth.accounts().then((val) => accounts = vals)
                                # anything you would normally do (asyncly) with an Eth
```

If you cloned the repo above, you can get started with our test contracts.
As with any JS module, when you import, you are shown a vast menu of delicious options to call.
Unlike with most JS modules, when you call a Democracy function with you arguments,
it tells you what it expects.

The four steps of Ethereum development operate on an automatic contract (sometimes called a `smart contract` by the exuberant)
* compiling (from a high-level language like Solidity to EVM bytecode)
* linking (connecting multiple contracts together, like using a library, and in our case, attaching a deploy account)
* deploy (send a contract to a blockchain, where it will now live and act trustlessly according to its programming)
* operate (send and receive messages from your contract, especially from a web page or app)

The first three tasks we'll show you how to do below by interacting with Democracy in a console.
However, Democracy's real power comes in automating complicated builds and deploys, and then operating on it.

We'll add a blow-by-blow console below when our dust has settled from above.

## How to Contribute

Democracy is a framework for learning about distributed systems and community protocols,
as well as a gateway for our upcoming distributed country. Welcome,
especially if you are a beginner to Ethereum or programming.

Here are ways you can participate
* Download the source code, send us suggestions, improvements, tests, documentations, via pull requests
* Use us in your next Ethereum (or eventually, Secure Scuttlebutt) project!
  * The best way to decide what you want in a framework is to try building with it
* If you're in NYC, drop by our [Arcology](http://arcology.nyc) and pair program with us
* Meet and chat with us on our community slack at http://invisible-slack.herokuapp.com
  * (Please read and agree to our community guidelines, which our friendly bot Greedo will give to you upon joining).

While we aim to be stable, featureful, and useful, we are primarily a platform for
cooperation and mob programming.

We are an adventure of the [Invisible College](http://invisible.college).
