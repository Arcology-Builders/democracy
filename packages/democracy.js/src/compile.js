// Compile with solcjs
fs     = require('fs')
path   = require('path')
solc   = require('solc')
assert = require('chai').assert

const { List, Map, Set }
       = require('immutable')

const { traverseDirs, ensureDir, COMPILES_DIR, ZEPPELIN_SRC_PATH, DEMO_SRC_PATH, fromJS }
       = require('demo-utils')

function compile(sourceStartPath, sources) {
  console.log(`Sources ${sources}`)
  // Open contracts installed by npm -E zeppelin-solidity
  // Open contracts from democracy
  inputs = {}
  assert.typeOf(sourceStartPath, 'string')
  if (sourceStartPath) {
    assert(fs.existsSync(sourceStartPath), `Start source path '${sourceStartPath}' does not exist`)
  }
  queue = Set([ sourceStartPath, DEMO_SRC_PATH, ZEPPELIN_SRC_PATH ]).filter((x) => x).toJS()

  ensureDir(COMPILES_DIR)

  traverseDirs(
    queue,
    (fnParts) => { return ((fnParts.length > 1) && !fnParts[1].startsWith('sol')) },
    function(source, f) {
      paths = f.split(path.sep)
      keys = []
      // This is a hack to push all suffixes of a contract path
      // since it's not clear which one solcjs will request
      // in findImport below
      do {
        keys.push(paths.join(path.sep))
        if (paths.length <= 1) { break }
        paths = paths.slice(-(paths.length - 1))
      } while(true)
      keys.forEach((key) => {
        if (inputs[key]) { console.log(`Replacing import ${key} with ${f}`) }
        inputs[key] = source
      })
    }
  )

  function findImports (path) {
    console.log(`path ${path}`)
    assert(inputs[path])
    return {contents: inputs[path]}
  }

  sourceMap = {}
  if (sources && sources.length > 2) {
    // Compile a single file if we get it as arg
    const targetName = path.basename(sources)
    sourceMap[targetName] = inputs[targetName]
  } else {
    // Otherwise compile all files
    for (var contract in inputs) {
      console.log(`${contract}: ${inputs[contract].length}`)
      const targetName = path.basename(contract)
      sourceMap[targetName] = inputs[contract]
    }
  }

  // Second arg is 1 for optimize, 0 for normal
  const outputs = solc.compile({sources: sourceMap}, 0, findImports)

  // Uncomment below to dump the output of solc compiler
  if (outputs.errors) {
    console.log(JSON.stringify(outputs.errors))
  }
  
  const compiles = List(Map(outputs.contracts).map((contract, contractName) => {
    contract.name = path.basename(contractName).split(':')[1]
    return contract
  }).values())

  return Map(compiles.map((contract) => {
    //shortName = contract.name //path.basename(contractName).split(':')[1]
    const output = Map({
      type: 'compile',
      name: contract.name,
      code: contract.bytecode,
      abi : fromJS(JSON.parse(contract.interface)),
    })
    const abiString = `abi${contract.name} = ${JSON.stringify(output['abi'], null, 2)}`
    const compileFilename = `${COMPILES_DIR}/${contract.name}.json`
    fs.writeFileSync(compileFilename, JSON.stringify(output))
    return [contract.name, output]
  }))
}

module.exports = compile
