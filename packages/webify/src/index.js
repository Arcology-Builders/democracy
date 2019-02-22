config = require('config')
//path = require('path')
//import submod2 from "./submodule"

//submodule = require(path.join(__dirname, 'submodule'))
console.log(`Submodule from Import  ${JSON.stringify(submodule)}`)
//console.log(`Submodule ${JSON.stringify(submodule)}`)
//console.log(`Config ${JSON.stringify(config)}`)
console.log(`Hello Config ${config['testKey']}`)
