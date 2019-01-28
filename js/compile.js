// Compile with solcjs
fs = require('fs')
path = require('path')
solc = require('solc')
assert = require('assert')

function compile(sources) {
  // Open contracts installed by npm -E zeppelin-solidity
  ZEPPELIN_PATH = "node_modules/zeppelin-solidity/contracts"
  // Open contracts from democracy
  DEMO_PATH = "src"
  inputs = {};

  queue = [ZEPPELIN_PATH, DEMO_PATH]

  while (queue.length > 0) {
    f = queue.pop();
    shortList = path.basename(f).split('.')
    if (shortList.length > 1 && !shortList[1].startsWith('sol')) { continue; } // Skip hidden files like DS_Store
    if (fs.lstatSync(f).isDirectory()) {
      fs.readdirSync(f).forEach((f2) => queue.push(path.join(f,f2)))
      //console.log(JSON.stringify(queue))
    } else {
      source = fs.readFileSync(f).toString();
      //key = f.replace("node_modules/zeppelin-solidity/", "")
      paths = f.split(path.sep)
      keys = []
      // This is a hack to push all suffixes of a contract path
      // since it's not clear which one solcjs will request
      // in findImport below
      do {
        keys.push(paths.join(path.sep))
        if (paths.length <= 1) { break; }
        paths = paths.slice(-(paths.length - 1))
      } while(true);
      keys.forEach((key) => inputs[key] = source)
    }
  }

  function findImports (path) {
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
  outputs = solc.compile({sources: sourceMap}, 0, findImports)

  // Uncomment below to dump the output of solc compiler
  if (outputs.errors) {
    console.log(JSON.stringify(outputs.errors))
  }

  for (var contractName in outputs.contracts) {
    shortName = path.basename(contractName).split(":")[1]
    const output = {
      name: shortName,
      code: outputs.contracts[contractName].bytecode,
      abi: JSON.parse(outputs.contracts[contractName].interface)
    }
    const abiString = `abi${shortName} = ${JSON.stringify(output['abi'], null, 2)}`
    fs.writeFileSync(`outputs/${shortName}.js`, JSON.stringify(output))
    fs.writeFileSync(`web/${shortName}-abi.js`, abiString)
  }
}

module.exports = compile
