#! /bin/sh

#WEBPACK="node ../../node_modules/webpack/bin/webpack.js"
WEBPACK="webpack"
rm dist/*
${WEBPACK} --mode production --json -p 2>&1 | tee logs/webpack.detailed.log
cd dist; ln -s $(ls -rt | head -n1) demo.min.js
