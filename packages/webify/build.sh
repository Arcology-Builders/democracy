#! /bin/sh

WEBPACK="node ../../node_modules/webpack/bin/webpack.js"
${WEBPACK} --mode production --json -p 2>&1 | tee logs/webpack.detailed.log
cd dist; rm demo.min.js; ln -s $(ls -rt | head -n2 | tail -n1) demo.min.js
