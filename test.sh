#!/bin/sh

mocha -t 10000 test/testDeploy.js
node test/testDemo.js
node test/testDb.js

./demo.js set 'someSpace/aaa' '{"a": 1, "b": 2}'
./demo.js get 'someSpace/aaa'
# {'a': 1, 'b': 2}

./demo.js set 'someSpace/aaa' null

./demo.js set 'anotherSpace/bbb' '{"c":3,"d":4}'
./demo.js set 'anotherSpace/ccc' '{"e":5,"f":6}'
./demo.js get 'anotherSpace'
# Value Map { "bbb": Map { "c": 3, "d": 4 }, "ccc": Map { "e": 5, "f": 6 } }

./demo.js set 'anotherSpace/ccc' null
./demo.js get 'anotherSpace'

# ./demo.js link TestUseLibrary test account0 link1 TestLibrary=deploy7
# ./demo.js deploy TestUseLibrary test link1 deployA _abc=123
