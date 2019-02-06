#!/bin/sh

mocha -t 10000 test/testDeploy.js
node test/testDemo.js

# ./demo.js link TestUseLibrary test account0 link1 TestLibrary=deploy7
# ./demo.js deploy TestUseLibrary test link1 deployA _abc=123
