#! /bin/sh

# Start this script to run a private blockchain for unit tests
ganache-cli --debug -h 0.0.0.0 -p 8545 -i 22 --db /var/ganache

# You can add the following to create deterministic test accounts
# --mnemonic "please put your twelve wallet words here my friend"
