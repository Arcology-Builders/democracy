democracy
=========

Tools for running a distributed country, currently on Ethereum.

With reusable components for general development.
Note: we have change our NPM package name from `@invisible-college/democracy`
to `democracy.js`.

[![npm version](https://badge.fury.io/js/democracy.js.svg)](https://badge.fury.io/js/democracy.js) `democracy.js` our main framework package and command interface, built on `ethjs`

[![npm version](https://badge.fury.io/js/%40democracy.js%2Futils.svg)](https://badge.fury.io/js/%40democracy.js%2Futils) `@democracy.js/utils` a browser-friendly key/value store and functions for managing build outputs / dependencies

[![npm version](https://badge.fury.io/js/%40democracy.js%2Fkeys.svg)](https://badge.fury.io/js/%40democracy.js%2Fkeys) `@democracy.js/keys` 
key and wallet management 

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

## Roadmap

This is a tentative roadmap to guide our exploration.
To the future!

[Design](Design)
  
* ~0.1 Release - basic subcommands and libraries for testing~
  * commands for deploying and interacting with contracts, use json files for now
  
* 0.2 Release - build dependency management, webify tests
  * add tx signing support, nonce management
  * clean up console.logging, add a decent logger
  * allow getting the latest undeleted key in a keyspace
  * show mocha runs inside a browser
  * improve documentation and tutorial

* 0.3 Release - whisper support
  [Whisper Design](Whisper Design)
  * commands for sending and listening to messages

* 0.4 Release - ssb config
  [SSB Design](SSB Design)
  * switch to using an ssb alternet for storing configs, artifacts, and messages
  * including sharing reproducible builds across the manyverse

* 0.5 Release - web-based Eth client / interface using BrowserFS, mobile friendly
  
* 0.6 Release - cross-chain swaps between Ethereum networks

* 0.7 Release - beginning work on a unified, isomorphic JS / EVM language

* 0.8 Release - a txpool for broadcasting and sponsoring unsigned raw transactions

* 0.9 Release - a nascent DAO

* 1.0 Release - zero-knowledge playground, certifying arbitrary data on SSB via on-chain ETH hashes

## REPL

To experiment with and administer Ethereum contracts, it's useful to have a central
console able to attach to any JSONRPC endpoint, whether it's on the mainnet or one
of the public testnets (Ropsten, Kovan, Rinkeby).

An example session looks like
```
node
> demo = require('democracy.js')
> eth = demo.getNetwork('test') # see config/default.json for other networks
> demo.doBalances(eth)          # show balances of available accounts
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

You can get a help message and then compile a Solidity contract, in this case `TestLibrary.sol`
in a local directory called `contracts`.

```
> demo.compile()
  [0 sourcePath]=?, <1 ContractName>=?
> demo.compile('contracts', 'TestLibrary.sol')
```

```
> demo.link()
<0 ContractName>=?, <1 netName>=?, <2 deployerAccount>=?, <3 linkId>=?, [4 depLink1=depDeploy1 depLink2=depDeploy2 ... ]=?
```

```
demo.deploy()
  <0 ContractName>=?, <1 netName>=?, <2 linkId>=?, <3 deployId>=?, [4 ctorArgs]=?
```

```
demo.deploy()
  <0 ContractName>=?, <1 netName>=?, <2 linkId>=?, <3 deployId>=?, [4 ctorArgs]=?
```


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
