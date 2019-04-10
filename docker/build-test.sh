#!/bin/sh
GITREF=$(git log | head -n 1 | cut -d ' ' -f 2 | head -c 7)

docker build -f Dockerfile.test -t cryptogoth/node-circle-test .
docker tag cryptogoth/node-circle-test:latest cryptogoth/node-circle-test:${GITREF} 
