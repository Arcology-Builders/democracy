#!/bin/sh

for x in $(ls -d ./node_modules/zeppelin-solidity/contracts/*/)
do
    pushd $x
    solc *.sol --abi --bin -o outputs --overwrite
    popd
done
