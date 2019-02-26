const keys = require('./keys')
const assert = require('chai').assert
const account = keys.create()

const body = document.getElementsByTagName('body')
assert(body.length == 1)
const accountString = JSON.stringify(account.toJS(), null, '  ')

console.log(`Account ${accountString}`)
const div = document.createElement('div')
div.innerHTML = accountString
body[0].append(div)
