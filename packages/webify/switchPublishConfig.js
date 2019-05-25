const pkgString = JSON.stringify(require('./package.json'), null, '  ')
const fs = require('fs')

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
