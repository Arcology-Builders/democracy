#! /bin/sh

# Build all geth images to Docker Hub.

./build-geth-base.sh $@
./build-mainnet.sh $@
./build-mainnet-light.sh $@
./build-rinkeby.sh $@
./build-rinkeby-light.sh $@
