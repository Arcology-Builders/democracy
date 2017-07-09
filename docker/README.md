Docker Images for Democracy
===========================

The following Docker Hub images encapsulate the environments for running a Democracy
as well as general-purpose Ethereum tasks, such as running a (light) node and deploying a contract.

# geth

https://hub.docker.com/r/cryptogoth/geth/
Running an Ethereum node on the mainnet (`networkid=1`) using geth on Ubuntu.
This is a base image for other `geth` images.

# geth-light

Running a light Ethereum node (with state only on-demand) on the mainnet using geth on Ubuntu.

# geth-rinkeby

Running an Ethereum node on the Rinkeby testnet (`networkid=4`) using geth on Ubuntu.
