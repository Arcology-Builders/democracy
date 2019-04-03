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

const fs = require('fs')
const path = require('path')
const { List, Map } = require('immutable')
if (!fs.existsSync('a')) { fs.mkdirSync('a') }

fs.writeFileSync(path.join('a', 'b.json'), "catcow")
const buffer = fs.readFileSync("a/b.json")
console.log(buffer.toString())
assert(buffer.toString() === 'catcow')

const { getImmutableKey, setImmutableKey, getNetwork, isDeploy, fromJS, thenPrint }
  = require('@democracy.js/utils')
const eth = getNetwork()

//setImmutableKey("a/d", new List([1,2,3]))
//console.log(getImmutableKey("a/d").toString())

const { create } = require('@democracy.js/keys')
const account = create()

const InvisibleLibrary = require('./invisible')
const deploy = fromJS(require('./InvisibleLibrary-deploy.json'))
assert(isDeploy(deploy))
const il = new InvisibleLibrary(eth, deploy, account.get('addressPrefixed'))
thenPrint(il.getArtifactCount())
