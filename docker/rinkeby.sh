#!/bin/bash -x

# Adapted from https://github.com/Kunstmaan/docker-ethereum/blob/master/geth-testnet/testnet.sh
# Generate and store a new account and password for mining transactions
# These can be used / donated to a faucet later.

NETWORK_ID=4
GETH="geth datadir=$HOME/.rinkeby --networkid $NETWORK_ID"

if [ ! -z "$1" ];
then
  LIGHT="--syncmode=light"
fi

$GETH --cache=512 --ethstats='yournode:Respect my authoritah!@stats.rinkeby.io' --bootnodes=enode://a24ac7c5484ef4ed0c5eb2d36620ba4e4aa13b8c84684e1b4aab0cebea2ae45cb4d375b77eab56516d34bfbd3c1a833fc51296ff084b770b94fb9028c4d25ccf@52.169.42.101:30303 ${LIGHT}

#$GETH --rpc --rpcaddr "0.0.0.0" --rpccorsdomain "*" --identity "$(echo ~/.nodeidentity)" --networkid $NETWORK_ID --password ~/.accountpassword --extradata "cryptogoth"

