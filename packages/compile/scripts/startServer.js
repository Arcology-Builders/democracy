#!/usr/bin/env node

const RESTServer = require('@democracy.js/rest-server')
const s = new RESTServer(7000, true)

s.listen()
