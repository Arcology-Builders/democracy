#!/bin/sh

if [ -z "${NODE_ENV}" ]; then
  export NODE_ENV=DEVELOPMENT
fi

../../node_modules/.bin/demo-depart --departFileName departAZ.js
../../node_modules/.bin/demo-depart --departFileName departSP.js
../../node_modules/.bin/demo-depart --departFileName departZK.js AAA
../../node_modules/.bin/demo-depart --departFileName departZK.js BBB
