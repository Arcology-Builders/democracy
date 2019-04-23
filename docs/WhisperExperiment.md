Whisper Experiments
===================

Whisper is a distributed private messenger that is an overlay protocol with Ethereum,
coexisting with it and having messages relayed on Ethereum nodes with the `shh` module
enabled. This document describes our investigation into using Whisper for an in-browser
private messenger for an encrypted sidechannel coordinating Ethereum on-chain activities,
as well as understanding its guarantees for darkness.

## Tools

`wnode` is a command-line diagnostic tool that allows one to run a bare Whisper-only node
(without the Ethereum modules). It is not part of any released distribution, but can be
built from sources in `geth` (`go-ethereum`) by downloading and extracting the latest
release, and running from the root `go-ethereum` source directory
```
build/env.sh go run build/ci.go install ./cmd/wnode
```

## Tasks

The basic operational tasks we would like to perform are

* Running a local Whisper node for the Status tutorial, within the same docker container.
* Changing from a command-line to a web demo, using `web3` if necessary
* Opening Whisper to accepting outside connections (listening on `0.0.0.0`) and working with the Status tutorial outside the docker container.
* Running our own public Whisper-enabled `parity` node with both http and ws available.
* Testing two wnode's connecting to different public nodes able to send messages to each other

## Public Whisper Nodes

These can be manually added with `admin.addPeer` in an attached `geth` console,
or passed into `wnode` as the peer node.

### Mainnet

These are rare birds, and no one advertises that they have them.

### Testnet

As far as I can tell, these are indistinguishable from mainnet nodes, and independent of
Ethereum on-chain transactions. So it should just form one big DHT over both "testnet"
and "mainnet" messages, and would be an interesting way to bridge the two.

* `enode://f0fa95ee17a42b4cf5fee104c5ad61115ff63b2f720c027b1246188afc93a61ba1d67121ea9ebfa78678e796a562a5d949ed5265549f0a4936b7f3bd8d5d2706@35.170.55.156:30303`

## Projects Using Whisper

These are other projects or companies using Whisper, whose engineers we can potentially ask for help.
* Status (http://status.im)
* Bloom (http://hellobloom.co)

## Chats

ethereum/whisper gitter

## Resources

How to run a Status/Whisper docker image, with external configuration
* https://dev.status.im/docs/run_status_node.html

Bloom State Channels using Whisper
* https://blog.hellobloom.io/introducing-bloom-payment-channels-enabled-by-ethereum-whisper-1fec8ba10a03

Building Status (I hand it to them, it is all open source)
* https://status.im/build_status/status_go.html

HTTPS proxy, for secure access to our own Whisper nodes, e.g. for the transfer of private keys
* https://github.com/nodejitsu/node-http-proxy#using-https

## Outstanding Questions

* If a Whisper client asks the node to generate a new keypair, and retrieves both the public and private key by ID,
then what is to keep a node operator from stealing these private keys, reading private messages, or faking new messages
from this identity?
* Are Whisper keypairs generatable through some external means and importable into a node? E.g. `secp256k1` curve points
using an external library like `keythereum`
* Does each user need to run their own minimal node (perhaps with wnode) purely for the purpose of generating and storing
their keypairs securely?
* If the previous, can we run the experimental `ethereumjs-client` in a browser for this purpose, if it has an `shh` module?
