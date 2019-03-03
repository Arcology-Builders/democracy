// Compile with solcjs
fs     = require('fs')
path   = require('path')
solc   = require('solc')
assert = require('chai').assert

const { List, Map }
       = require('immutable')

const { traverseDirs, ensureDir, COMPILES_DIR, ZEPPELIN_SRC_PATH, DEMO_SRC_PATH, fromJS }
       = require('@democracy.js/utils')

function compile(sourceStartPath, sources) {
  console.log(`Sources ${sources}`) // Open contracts installed by npm -E zeppelin-solidity
  // Open contracts from democracy
  const inputMap = {} // map of file paths to source contents
  assert.typeOf(sourceStartPath, 'string')
  assert(fs.existsSync(sourceStartPath), `Start source path '${sourceStartPath}' does not exist`)

  queue = [ sourceStartPath ] || [ DEMO_SRC_PATH, ZEPPELIN_PATH ]

  ensureDir(COMPILES_DIR)

  traverseDirs(
    queue,
    (fnParts) => { return ((fnParts.length > 1) && !fnParts[1].startsWith('sol')) },
    function(source, f) {
      paths = f.split(path.sep)
      console.log(`PATHS ${JSON.stringify(paths)}`)
      keys = []
      // This is a hack to push all suffixes of a contract path
      // since it's not clear which one solcjs will request
      // in findImport below
      do { console.log(`path key =${paths.join(path.sep)}`)
        keys.push(paths.join(path.sep))
        if (paths.length <= 1) { break }
        paths = paths.slice(-(paths.length - 1))
      } while(true)
      keys.forEach((key) => inputMap[key] = source)
    }
  )

  function findImports (path) {
    console.log(`import ${path}`)
    return (inputMap[path]) ?  {contents: inputMap[path]} : {error: `Path ${path} not found.`}
  }
  
  sourceMap = {}
  if (sources && sources.length > 2) {
    // Compile a single file if we get it as arg
    const targetName = path.basename(sources)
    sourceMap[targetName] = { content: inputMap[targetName] }
  } else {
    // Otherwise compile all files
    for (var contract in inputMap) {
      console.log(`${contract}: ${inputs[contract].length}`)
      const targetName = path.basename(contract)
      sourceMap[targetName] = { content: inputMap[contract] }
    }
  }

  console.log(`SourceMap ${JSON.stringify(sourceMap)}`)

  const inputs = {
    language: 'Solidity',
    sources: sourceMap,
    settings: {
      outputSelection: {
        '*': {
          '*': [ '*' ]
        }
	  	}
    }
  }

  // Second arg is 1 for optimize, 0 for normal
  const outputs = fromJS(JSON.parse(solc.compile(JSON.stringify(inputs), findImports)))

  // Uncomment below to dump the output of solc compiler
  if (outputs.get('errors')) {
    console.log(JSON.stringify(outputs.get('errors')))
  }
  
  console.log(`OUTPUTS ${JSON.stringify(outputs.toJS(), null, '  ')}`)
  
  //console.log(`OUTPUTS ${outputsImm.toString()}`)
  return outputs.get('contracts').map((contractMap, contractFilename) => {
    console.log(`contractFilename ${contractFilename}`)
    return contractMap.map((contract, contractName) => {
      console.log(`contractName ${contractName}`)
      const output = Map({
        type: 'compile',
        name: contractName,
        ...contract.toJS()
      })
      console.log(`output ${JSON.stringify(contract.toJS())}`)
      //const abiString = `abi${contract.name} = ${JSON.stringify(output['abi'], null, 2)}`
      const compileFilename = `${COMPILES_DIR}/${contractName}.json`
      fs.writeFileSync(compileFilename, JSON.stringify(output))
      return output
    })
  }).reduce((mapsSoFar, map) => { return mapsSoFar.merge(map) }, Map({}))
/*
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
 */
}

module.exports = compile
