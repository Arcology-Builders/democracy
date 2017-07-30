#! /bin/sh
# Build and tag base geth image for development
# Does not create or sync any blockchains.

DOCKERDIR=geth-base
. build.sh $1
