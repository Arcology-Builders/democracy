#!/bin/sh

NODE_ENV=DEVELOPMENT ../../node_modules/.bin/demo-depart
NODE_ENV=DEVELOPMENT ../../node_modules/.bin/demo-depart --departFileName departSP.js
NODE_ENV=DEVELOPMENT ../../node_modules/.bin/demo-depart --departFileName departZK.js AAA
NODE_ENV=DEVELOPMENT ../../node_modules/.bin/demo-depart --departFileName departZK.js BBB
