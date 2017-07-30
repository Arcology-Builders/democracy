Docker Images for Democracy
===========================

The following Docker Hub images encapsulate the environments for running a Democracy
as well as general-purpose Ethereum tasks, such as running a (light) node and deploying a contract.

All build scripts prepare the context for their corresponding Docker images,
run `docker built -t` tagged with the current git hash in the `cryptogoth` repo.
(TODO: Change this to `invisible-college` repo).

After building, you will still need to log into DockerHub to push the image.

```
docker login
docker push cryptogoth/<image name>:<tag>
```

# geth

https://hub.docker.com/r/cryptogoth/geth/
The base image for other `geth` images.
Includes `geth`, `solc`, `vim`, `git`, `telnet`, `ping`, and other CLI tools needed to develop Ethereum on Ubuntu.
Creates a unique SSH key when you run the image for the first time.
Does not actually start syncing geth on any network. This is left to child images.

To build:
```
./build-geth.sh
```

# geth-light

Running a light Ethereum node (with state only on-demand) on the mainnet using geth on Ubuntu.

# geth-rinkeby

Running an Ethereum node on the Rinkeby testnet (`networkid=4`) using geth on Ubuntu.

# geth-rinkeby-light

Running a light Ethereum node on the Rinkeby testnet.
