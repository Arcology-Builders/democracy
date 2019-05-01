#! /bin/sh

# Start this script to run a private blockchain for unit tests
ganache-cli -p 8545 --acctKeys keys/ganache.test.json -i 2222 --debug -v
