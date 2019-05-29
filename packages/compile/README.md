# `demo-compile`

Compiling management for EVM languages in the Democracy framework, initially only in Solidity.
* Automatically includes OpenZeppelin contracts (in Solidity 0.5.x)
* Flattens Solidity contracts into a single file for Etherscan verification, Remix compilation,
  and other online tools

Future goals include
* adding multiple language support, such as or [Huff macros](https://github.com/AztecProtocol/huff) for zero-knowledge validation and [Vyper](https://github.com/ethereum/vyper)
* support [web3bindings](https://github.com/web3bindings/prototype) to allow integrated GraphQL / IPFS / dataflow and workflow.
* integrating into the Pipeline plugin on Remix for programmatic / reproducible builds
* supporting EthPM, both pulling in packages and publishing packages

## Installation

You can install and use `demo-compile` independently of the other Democracy packages.

```
yarn add demo-compile
```

or

```
npm install demo-compile
```

This also installs OpenZeppelin contracts into
`node_modules/openzeppelin-solidity/contracts` either in your Yarn workspace
or the local package, which is included in the search path for your contracts.

You can import those contracts automatically in your own as follows,
where the relative path does not matter. All contract source filenames should
be unique, and you can organize them arbitrarily into subfolders.

```
import "ERC20.sol"
```

## Usage

```
const { Compiler, Flattener } = require('demo-compile');
const c = new Compiler({ startSourcePath: 'contracts' })
const output = await c.compile( 'ERC20.sol' )
```

## Structure

`demo-compile` itself is a collection of components and a conventional pipeline
for putting them together.

The pipeline moves from source files to compiled EVM bytecode and metadata,
organized by contract name, that can then be linked and deployed by
`demo-depart`

It includes four stages with a defined specification in between them.
* Stage 1: Reading source files from storage
  * Output map has `key`: contract name, `value`: source contents
* Stage 2: Reading cached compile outputs and comparing content hashes
  * Output map has `key`: contract name, `value`: source contents
* Stage 3: Creating language-specific inputs and configs (e.g. `solc`)
  * Output map has `key`: contract name, `value`: contract output
* Stage 4: Call the language-specific compiler
  * Output map: specific to the language
* Stage 4: Writing compiler-specific outputs back to storage
  Formatting the language-specific output
  * Output map has `key`: contract name, `value`: contract output

`demo-compile` also makes use of the `ContractsManager` in `demo-contract`,
which provide convenience methods for saving contract outputs to a Democracy
(remote) key-value store.

* getContract(contractName)
* isCompile

### Solidity Filename Convention

While a single Solidity file can contain multiple Solidity classes,
we require the convention that a Solidity file named e.g. `Booberry.sol` contain
only one class of the same name, called `Booberry` in this case.

### Stage 1: Reading Source Files from Storage

```
const { findImports, requestedInputs } = getRequestedInputsFromDisk(sourceFileName, flattener)
```

```
const flattener = new Flattener()
getRequestedInputsFromDisk('ERC20.sol', new Flattener())
```

The single top-level filename and a fresh flattener object to pass into a
`findImports` callback to collect imports for later flattening.

`findImports(path)` should return the source of a file as a long string,
such as `findImports('ERC20Mintable.sol')` yields

```

```

and also adds it to the flattener via

```
flattener.addSource('ERC20Mintable.sol', fileContents)
```

`requestedInputs` is an Immutable Map with contract name keys and source content values.

```
return Map({
  contractName: fileContents
})
```

### Stage 2: Comparing Content Hashes

```
getInputsToBuild(requestedInputs, existingOutputs)
```

```
return Map({
  contractName: fileContents
})
```

### Stage 3: Language-Specific Inputs and Configs

```
get
```

### Stage 4: Call the language-specific compiler

```
return Map({
  contractName: { abi: [{ ... }]
                  evm: {
                    bytecode: {  }
                  }
                }
})
```
### Stage 5: Language-Specific Outputs

```
getCompileOutputFromSolc(outputContractsMap, requestedInputs, existingOutputs)
```

```
return Map({
})
```
