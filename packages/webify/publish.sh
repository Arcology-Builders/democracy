#!/bin/sh

./build.sh
node ./switchPublishConfig.js publicize
npm publish 2>&1 | tee logs/publish.log
node ./switchPublishConfig.js privatize
