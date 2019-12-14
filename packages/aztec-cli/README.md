# demo-aztec
A toolbox for multi-security zero-knowledge issuance and trading with [AZTEC](https://github.com/AztecProtocol/AZTEC) and
[Democracy](https://github.com/invisible-college/democracy)

[![npm version](https://badge.fury.io/js/demo-aztec.svg)](https://badge.fury.io/js/demo-aztec)
[![CircleCI](https://circleci.com/gh/invisible-college/demo-aztec.svg?style=svg)](https://circleci.com/gh/invisible-college/demo-aztec)

Building blocks for private voting and a decentralized zero-knowledge (hidden price) exchange.

(Try out our command-line demo)[DEMO.md] using our public server.

See our web demo at (http://demo-aztec.herokuapp.com)[http://demo-aztec.herokuapp.com]

We'll upload a screencast showing the step-by-step demo here soon.

### Get Started in Local Development

To start developing on your local computer:

```
git clone git@github.com:invisible-college/demo-aztec.git 
cd demo-aztec
yarn
yarn start:rest
yarn start
```

### Deploy Contracts

Browse to `http://localhost:3000` and you'll see
some seagreen boxes of all `ZkAssetMintable`'s that you've deployed
on the local testnet.

## Issue and Mint

To see multi-security issuance and minting in action using your local
development environment, perform the following steps

* Start Ganache: `ganache-cli -p 8545 -h 0.0.0.0 -i 2222`
* Run the following commands 
```
NODE_ENV=DEVELOPMENT ./node_modules/.bin/demo-depart
NODE_ENV=DEVELOPMENT ./node_modules/.bin/demo-depart --departFileName departZK.js AAA
```

You can mint to the hardcoded `TEST_ADDRESS_1` in the `.env` file.
```
NODE_ENV=DEVELOPMENT ./scripts/mint.js AAA 22
```

You can also mint to a specific address and public key using the following command-line
arguments.
The public key should be in AZTEC form, which an extra byte in front to indicate
it is a compressed coordinate.

```

node src/mint.js \
  --tradeSymbol AAA \
  --minteeAddress 0x1051Cd3F5D5f3E097713265732A10677C043CcEA \
  --minteePublicKey 0x04b56dcc4375e855adba8f37a2a9cce64809b3d24d1981daa7c9e3f98316676b06b27a85b889559c09ad442f2636491ceb6930589cee609258df8da29e852a1312 \
  --minteeAmount 22
```

You can repeat the above with NODE_ENV equal to TEST, RINKEBY, or MAINNET

At the end of the minting process, you'll receive a note hash which identifies the
newly minted note. You'll need that in the next step.

## Confidential Transfer

You can do a confidential transfer from the hardcoded `TEST_ADDRESS_1`
to the hardcoded `TEST_ADDRESS_2` using the following command,
replacing the long hex number and the 22 with the note has you received
at the end of the minting process above, and the amount you want to transfer
in encrypted tokens.

```
NODE_ENV=DEVELOPMENT ./scripts/cx.js AAA 0xb22df01622b30138138b4b96589294301eea6484beb63018c42105a4fcd45349 22
```

## Status

You can display metadata such as note status and its creation/destroy date as follows.

```
NODE_ENV=DEVELOPMENT ./scripts/status.js AAA 0xdc2f748c779292134adda6e4d25155c96f7b0b44998e2cd224b254f683c7fbb3 2 1
```

## Swap Proxy

A key primitive on top of confidential transfers is an atomic swap,
linking the transfers of two assets so that they either succeed together or fail together.

As an intermediate step, you can perform the same confidential transfer above, but
delegated to a proxy contract.

```
NODE_ENV=DEVELOPMENT ./scripts/cx.js AAA 0xfdcf1c1df863f84fbc33b1ba483c05c1c32a9b4b2a3aa9c369ea10339a02b1aa 5 3 2 4 true proxy1
```

## Keys

By default, we've committed a test Ethereum account in the file
`db/keys/2222/0x1051Cd3F5D5f3E097713265732A10677C043CcEA`.

You can also use your own Ethereum account (address and password) created with
Democracy tools (to be documented soon).
Simply substitute the following lines in your `.env` file.

```
DEVELOPMENT.DEPLOYER_ADDRESS="0xactualaddresshere"
DEVELOPMENT.DEPLOYER_PASSWORD="actualpasswordhere"
```
