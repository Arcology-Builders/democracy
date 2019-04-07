const RESTServer = require('./src/server')

server = new RESTServer(7000, true)
server.start()
