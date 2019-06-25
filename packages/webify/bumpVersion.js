#!/usr/bin/env node
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
  return (v2Greater < v1Greater || !v1Greater) ? _ver2 : _ver1
}

const latestVersion = deps.reduce((latest, version) => laterVersion(latest, version), '0.0.0')

pkgJSON['version'] = latestVersion
console.log(`Latest version found ${latestVersion}`)

const pkgString = JSON.stringify(pkgJSON, null, '  ')

fs.writeFileSync( './package.json', pkgString )
