require('@babel/polyfill')
const config = require('./config.json')
const assert = require('chai').assert

submodule = require('./submodule')
console.log(`Submodule from Import  ${JSON.stringify(submodule)}`)
console.log(`Hello Config ${JSON.stringify(config)}`)

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

const fs = require('fs')
const path = require('path')
const { List } = require('immutable')
if (!fs.existsSync('a')) { fs.mkdirSync('a') }

fs.writeFileSync(path.join('a', 'b.json'), "catcow")
const buffer = fs.readFileSync("a/b.json")
console.log(buffer.toString())
assert(buffer.toString() === 'catcow')

//const demo = require('democracy.js')
const { getImmutableKey, setImmutableKey } = require('@democracy.js/utils')
//setImmutableKey("a/d", new List([1,2,3]))
//console.log(getImmutableKey("a/d").toString())

window.fs = fs
window.path = path
