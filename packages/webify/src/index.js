require('@babel/polyfill')
const assert = require('chai').assert

BrowserFS.FileSystem.LocalStorage.Create(function(e, lsfs) {
  BrowserFS.FileSystem.InMemory.Create(function(e, inMemory) {
		BrowserFS.FileSystem.MountableFileSystem.Create({
			'/tmp': inMemory,
			'/': lsfs
		}, function(e, mfs) {
			BrowserFS.initialize(mfs);
			// BFS is now ready to use!
		});
  });
});

//const { getConfig, getImmutableKey, setImmutableKey, Logger } = require('@democracy.js/utils')

require('dotenv').config()
const utils = require('@democracy.js/utils')
const util = require('ethereumjs-utils')
const keys = require('@democracy.js/keys')
/*
const LOGGER = new Logger('src/index')

submodule = require('./submodule')
LOGGER.info(`Submodule from Import  ${JSON.stringify(submodule)}`)
LOGGER.info(`Hello Config ${JSON.stringify(config)}`)
*/
const fs = require('fs')
const path = require('path')
const { List } = require('immutable')
if (!fs.existsSync('a')) { fs.mkdirSync('a') }

fs.writeFileSync(path.join('a', 'b.json'), "catcow")
const buffer = fs.readFileSync("a/b.json")
console.log(buffer.toString())
assert(buffer.toString() === 'catcow')

//const demo = require('democracy.js')
//setImmutableKey("a/d", new List([1,2,3]))
//console.log(getImmutableKey("a/d").toString())

window.fs = fs
window.path = path
