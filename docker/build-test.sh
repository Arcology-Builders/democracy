#!/bin/sh
GITREF=$(git log | head -n 1 | cut -d ' ' -f 2 | head -c 7)

NODE_VERSION=16.14

docker build --platform linux/arm64/v8 -f docker/Dockerfile.test -t cryptogoth/node-circle-test:${NODE_VERSION} .
docker tag cryptogoth/node-circle-test:${NODE_VERSION} cryptogoth/node-circle-test:${GITREF} 
