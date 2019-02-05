// Utilities
fs = require('fs')
path = require('path')

const { Map, fromJS } = require('immutable')

SOURCES_DIR  = 'contracts'
COMPILES_DIR = 'compiles'
LINKS_DIR    = 'links'
DEPLOYS_DIR  = 'deploys'
LIB_PATTERN  = /__(([a-zA-Z])+\/*)+\.sol:[a-zA-Z]+_+/g

function print(data) {
  console.log(JSON.stringify(data, null, '  '))
}

function ensureDir(dirName) {
  if (!fs.existsSync(dirName)) { fs.mkdirSync(dirName, { recursive: true } ) }
}

/**
 * Traverse directories collecting files to perform a callback function on
 * @param startDirs a list of paths to start searching in
 * @param skipFilt a function that returns true for files that need to be skipped
 * @param cb a callback that accepts the source text of a file plus its full path
 */
function traverseDirs(startDirs, skipFilt, cb) {
  queue = startDirs
	while (queue.length > 0) {
		f = queue.pop();
		shortList = path.basename(f).split('.')
    if (skipFilt(shortList)) { continue; }
    if (fs.lstatSync(f).isDirectory()) {
      fs.readdirSync(f).forEach((f2) => queue.push(path.join(f,f2)))
    } else {
      source = fs.readFileSync(f).toString();
      cb(source, f)
    }
  }
}

function getLinks(networkId) {
  linkMap = {}
  ensureDir(`${LINKS_DIR}/${networkId}`)
  traverseDirs(
    [`${LINKS_DIR}/${networkId}`],
    (fnParts) => { return (fnParts.length > 1 && !fnParts[1].startsWith('json')) },
    // Link names will have the form <contractName>-<linkID>, do we need to
    // differentiate different deploy IDs for a single contract name?
    (source,f) => { linkMap[path.basename(f)] = JSON.parse(source) }
  )
  return fromJS(linkMap)
}


function getDeploys(networkId) {
  deployMap = {}
  ensureDir(`${DEPLOYS_DIR}/${networkId}`)
  traverseDirs(
    [`${DEPLOYS_DIR}/${networkId}`],
    (fnParts) => { return (fnParts.length > 1 && !fnParts[1].startsWith('json')) },
    // Deploy names will have the form <contractName>-<deployID>, do we need to
    // differentiate different deploy IDs for a single contract name?
    (source,f) => { deployMap[path.basename(f)] = JSON.parse(source) }
  )
  return fromJS(deployMap)
}

/**
 * Return a contract read from a file in the `outputs/${networkId}` directory.
 * @param contractName name of the compiled contract
 */
getContract = (contractName) => {
  ensureDir(`${COMPILES_DIR}/${networkId}`)
  const { contractOutputs } = getContracts()
  return contractOutputs.get(contractName)
}

/**
 * Return a link object read from a file in the `links/${networkId}` directory.
 * @param networkId name of the chain / network deployed onto
 * @param linkName the name of the contract and link ID of the form `ContractName-linkId`
 */
getLink = (networkId, linkName) => {
  const linkMap = getLinks(networkId)
  return linkMap.get(linkName)
}

/**
 * Return a deploy object read from a file
 * @param networkId name of the chain / network deployed onto
 * @param deployName the name of the contract and deploy of the form `ContractName-deployId`
 */
getDeploy = (networkId, deployName) => {
  const deployMap = getDeploys(networkId)
  return deployMap.get(deployName)
}

cleanCompile = (compileName) => {
  fs.unlinkSync(`${COMPILES_DIR}/${compileName}.json`)
}

cleanLink = async (eth, linkName) => {
  const networkId = await eth.net_version()
  fs.unlinkSync(`${LINKS_DIR}/${networkId}/${linkName}.json`)
}

cleanDeploy = async (eth, deployName) => {
  const networkId = await eth.net_version()
  fs.unlinkSync(`${DEPLOYS_DIR}/${networkId}/${deployName}.json`)
}

clean = async (eth) => {
  const networkId = await eth.net_version()
  fs.rmdirSync(`${COMPILES_DIR}`)
  fs.rmdirSync(`${LINKS_DIR}/${networkId}/${linkName}`)
  fs.rmdirSync(`${DEPLOYS_DIR}/${networkId}/${deployName}`)
}

function thenPrint(promise) {
  promise.then((value) => {console.log(JSON.stringify(value))})
}

module.exports = {
  traverseDirs  : traverseDirs,
  thenPrint     : thenPrint,
  print         : print,
  ensureDir     : ensureDir,
  getDeploys    : getDeploys,
  getDeploy     : getDeploy,
  getLinks      : getLinks,
  getLink       : getLink,
  getContract   : getContract,
  cleanCompile  : cleanCompile,
  cleanLink     : cleanLink,
  cleanDeploy   : cleanDeploy,
  clean         : clean,
  LIB_PATTERN   : LIB_PATTERN,
  SOURCES_DIR   : SOURCES_DIR,
  COMPILES_DIR  : COMPILES_DIR,
  LINKS_DIR     : LINKS_DIR,
  DEPLOYS_DIR   : DEPLOYS_DIR,
}
