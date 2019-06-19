Road Map
=========

Tools for running a distributed country, currently on Ethereum.

## Next Release Goals

These are active development goals for the next release here (June 2019)

* 0.3.2 Improve webify bundle, React components, generic signing for ZkAsset issuing, trading, private voting
  * allow test key unlocking across refreshes, and manual relocking in API
  * add secp256k1 from Aztec and use for generating keys
  * export secp256k1 in webify
  * break out compile into its own departure mixin, for webifying
  * test deploying new contracts in browser
  * render react components listening to Websocket mongo changes like 
  * pass in a LOGGER from argListMixin
* 0.3.3 - decode sourceMap to help with revert and debugging
  * check source hashes and dependencies of all imports, not just top-level file
  * improve flattening to reorder sources of imports
* 0.3.4 - React UI of deploys on Rinkeby
  * especially ZkAssets for private voting

## Roadmap

This is a tentative roadmap to guide our exploration.
To the future!

* ~0.1 Release - basic subcommands and libraries for testing~
  * ~commands for deploying and interacting with contracts, use json files for now~
  
* 0.2 Release - build dependency management, webify tests
  * ~add tx signing support, nonce management~
  * ~clean up console.logging, add a decent logger~
  * show mocha runs inside a browser (as a first step to refactoring webpack bundle)
  * ~improve documentation~ and tutorial

* 0.3 Release - Debugger & Web UI 
  * flatten Solidity source code, use source maps to determine where reverts happen
  * basic React web UI showing a blockchain explorer
  * add new solidity compiler support
  * display linked contracts (AZTEC & DAOStack) and automate workflows through them
  * store / display contract interactions 

See our [project planning ](https://github.com/invisible-college/democracy/projects/1)
for more ideas and goals for longer-term releases.

## Old Release Notes

After a patch release above, the accumulated release notes are moved down here,
and eventually to Github releases

* 0.3.1 - Improved, succint departure syntax, successful ZkAssets with AZTEC
  * ~taking in the following args from depart.js~
    * `unlockSeconds`
    * `sourcePath`
    * `testValueETH`
    * `testAccountIndex`
  * ~multiple source paths~
  * ~pass in `deployed` and `minedTx` for transparency~
  * ~allow depart.js to specify command-line args like tradeSymbol~
  * ~find some other logic for process.argv other than `*.js` to skip JS commands~
  * ~add names command-line flags instead of positional args~
  * install javascript bin
  * if `testValueETH` not found, skip funding from a test account
  * don't warn in Compiler for replacing import
  * allow passing in alternative deployerAddress / deployerPassword into deployerMixin
