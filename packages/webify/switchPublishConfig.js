// Temporarily enable publishing a private package
// and bump version number to latest of any dependency
'use strict'
const pkgJSON = require('./package.json')
const fs = require('fs')

const { Map, List } = require('immutable')
const deps = new Map(pkgJSON['dependencies']).merge(new Map(pkgJSON['devDependencies']))

const preMap = {
  'alpha': 1,
  'beta': 2,
}

// Accepts two npm package versions of the form x.y.z-{alpha,beta}.w
// and returns which one is later than the other, where beta is later than alpha.
const laterVersion = (ver1, ver2) => {

  const _ver1 = ver1.startsWith('^') ? ver1.slice(1) : ver1
  const parts1 = _ver1.split('-').map((part) => part.split('.')).flat()
    .map(v => preMap[v] ? preMap[v] : Number(v))

  const _ver2 = ver2.startsWith('^') ? ver2.slice(1) : ver2
  const parts2 = _ver2.split('-').map((part) => part.split('.')).flat()
    .map(v => preMap[v] ? preMap[v] : Number(v))

  const diffs = List(parts1).zip(List(parts2)).map(([v1, v2]) => v2 - v1)
  const v2Greater = diffs.findKey(x => x > 0)
  const v1Greater = diffs.findKey(x => x < 0)
  console.log(`v2Greater ${v2Greater}`)
  return (v2Greater) ? ((v2Greater < v1Greater || !v1Greater) ? ver2 : ver1) : ver1
}

const latestVersion = deps.reduce((latest, version) => laterVersion(latest, version), '0.0.0')

pkgJSON['version'] = latestVersion
console.log("Latest version found" + latestVersion)

const pkgString = JSON.stringify(pkgJSON, null, '  ')

const publish = {}

publish.PUBLISH_STRING =
'  "publishConfig": {\n'+
'    "access": "public"\n'+
'  },'

publish.PRIVATE_STRING = '  "private": true,'

if (process.argv[2] === 'privatize') {

  fs.writeFileSync('./package.json',
                   pkgString.replace(publish.PUBLISH_STRING, publish.PRIVATE_STRING))

} else if (process.argv[2] === 'publicize') {

  fs.writeFileSync('./package.json',
                   pkgString.replace(publish.PRIVATE_STRING, publish.PUBLISH_STRING))

} else {
  console.error(`Usage: ${process.argv[1]} [publicize|privatize]`)
}

module.exports =  publish
