#!/bin/sh

mocha -t 10000 test/testDeploy.js
node test/testDemo.js
node test/testDb.js

./demo.js set someSpace aaa '{"a": 1, "b": 2}'

./demo.js get someSpace aaa
# {'a': 1, 'b': 2}

# ./demo.js link TestUseLibrary test account0 link1 TestLibrary=deploy7
# ./demo.js deploy TestUseLibrary test link1 deployA _abc=123
