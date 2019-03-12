const keys = require('./keys')
const assert = require('chai').assert
const account1 = keys.create()
const randombytes = require('randombytes')
const account2 = keys.createFromPrivateString(randombytes(32).toString('hex'))

const body = document.getElementsByTagName('body')
assert(body.length == 1)
const accountString = JSON.stringify(account1.toJS(), null, '  ')

console.log(`Account ${accountString}`)
const div = document.createElement('div')
div.innerHTML = accountString
body[0].append(div)
