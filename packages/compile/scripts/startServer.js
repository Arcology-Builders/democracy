#!/usr/bin/env node

const { setFS, setPath } = require('@democracy.js/utils')
setFS(require('fs'))
setPath(require('path'))

const RESTServer = require('@democracy.js/rest-server')
const s = new RESTServer(7000, true)

s.listen()
