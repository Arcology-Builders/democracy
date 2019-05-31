Road Map
=========

Tools for running a distributed country, currently on Ethereum.

## Next Release Goals

* 0.3.1 - Improved, succint departure syntax, taking in the following args from depart.js
  * `unlockSeconds`
  * `sourcePath`
  * `testEthValue`
  * `testAccountIndex`
* 0.3.2 - Deployed ZKAssets with AZTEC

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
