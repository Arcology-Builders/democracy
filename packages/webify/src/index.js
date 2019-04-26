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

require('dotenv').config()
const utils = require('demo-utils')
const fs = require('fs')
const path = require('path')
const contract = require('demo-contract')
const util = require('ethereumjs-utils')
const keys = require('demo-keys')
const tx = require('demo-tx')

const { List } = require('immutable')
if (!fs.existsSync('a')) { fs.mkdirSync('a') }

fs.writeFileSync(path.join('a', 'b.json'), "catcow")
const buffer = fs.readFileSync("a/b.json")
console.log(buffer.toString())
assert(buffer.toString() === 'catcow')

module.exports = {
  fs: fs,
  path: path,
  utils: utils,
}
