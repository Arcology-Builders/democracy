#!/bin/bash -x

# Adapted from https://github.com/Kunstmaan/docker-ethereum/blob/master/geth-testnet/testnet.sh
# Generate and store a new account and password for mining transactions
# These can be used / donated to a faucet later.

NETWORK_ID=2222

if [ ! -f ~/.accountpassword ]; then
    echo `date +%s | sha256sum | base64 | head -c 32` > ~/.accountpassword
fi

if [ ! -f ~/.primaryaccount ]; then
    geth --networkid $NETWORK_ID --password ~/.accountpassword account new > ~/.primaryaccount
fi

if [ ! -f ~/.nodeidentity ]; then
    echo $(date +%s | sha256sum | head -c 8) > ~/.nodeidentity
fi

# Preallocate some ETH so that we are filthy stinkin rich and can run transactions right away
# without waiting for DAG to finish generating
ADDRESS=$(echo "0x"$(cat ~/.primaryaccount | cut -d "{" -f 2 | cut -d "}" -f 1))
sed -i "s/<address>/$ADDRESS/" ~/CustomGenesis.json

geth init ~/CustomGenesis.json

geth --rpc --rpcaddr "0.0.0.0" --rpccorsdomain "*" --identity "$(echo ~/.nodeidentity)" --networkid $NETWORK_ID --password ~/.accountpassword --mine --minerthreads 1 --extradata "cryptogoth"

