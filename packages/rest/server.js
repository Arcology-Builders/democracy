const { setFS, setPath } = require('@democracy.js/utils')
setFS(require('fs'))
setPath(require('path'))

const RESTServer = require('./src/server')

server = new RESTServer(7000, true)
server.start()
