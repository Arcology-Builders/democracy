#!/bin/bash -x

# Adapted from https://github.com/Kunstmaan/docker-ethereum/blob/master/geth-testnet/testnet.sh
# Generate and store a new account and password for mining transactions
# These can be used / donated to a faucet later.

GETH="geth"

if [ ! -z "$1" ];
then
  LIGHT="--syncmode=light"
fi

$GETH ${LIGHT}

