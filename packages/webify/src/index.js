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
const utils = require('@democracy.js/utils')
const contract = require('@democracy.js/contract')
const util = require('ethereumjs-utils')
const keys = require('@democracy.js/keys')

const fs = require('fs')
const path = require('path')
const { List } = require('immutable')
if (!fs.existsSync('a')) { fs.mkdirSync('a') }

fs.writeFileSync(path.join('a', 'b.json'), "catcow")
const buffer = fs.readFileSync("a/b.json")
console.log(buffer.toString())
assert(buffer.toString() === 'catcow')

window.fs = fs
window.path = path
