#!/bin/sh

set -x

#cat tsconfig.json| sed "s/"noEmit": true/"noEmit": false/g" > tsconfig.json.new 
#mv tsconfig.json tsconfig.json.old
#mv tsconfig.json.new tsconfig.json
tsc --build tsconfig.es5.json
