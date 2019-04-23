#!/usr/bin/env node

const { setFS, setPath } = require('demo-utils')
setFS(require('fs'))
setPath(require('path'))

const { RESTServer } = require('demo-rest')
const s = new RESTServer(7000, true)

s.listen()
