Road Map
=========

Our roadmap brainstorming and details are now tracked
in our [Roadmap Project](https://github.com/invisible-college/democracy/projects/1).

We are currently working on patch release 0.3.2 (browser wallet management)
in support of using AZTEC for private voting and zero-knowledge asset management.

We use the below themes to guide our exploration.

## Roadmap

* ~0.1 Release - basic subcommands and libraries for testing~
  * ~commands for deploying and interacting with contracts, using json files for now~
  
* 0.2 Release - build dependency management, webify tests
  * ~add tx signing support, nonce management~
  * ~clean up console.logging, add a decent logger~
  * ~improve documentation~ and tutorial

* 0.3 Release - Debugger & Web UI 
  * flatten Solidity source code, use source maps to determine where reverts happen
  * basic React web UI showing a blockchain explorer
  * add new solidity compiler support
  * display linked contracts (AZTEC & DAOStack) and automate workflows through them
  * store / display contract interactions 

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
