Road Map
=========

Tools for running a distributed country, currently on Ethereum.

## Roadmap

This is a tentative roadmap to guide our exploration.
To the future!

* ~0.1 Release - basic subcommands and libraries for testing~
  * ~commands for deploying and interacting with contracts, use json files for now~
  
* 0.2 Release - build dependency management, webify tests
  * ~add tx signing support, nonce management~
  * ~clean up console.logging, add a decent logger~
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
