# Tool Documentation

Command-line options for the minting and confidentialTransfer scripts,
as well as older scripts, are documented here.

## Script and Demo

Until we upgrade to Democracy 0.3.3, we provide the following utility scripts
which pass in the above, fairly verbose, command-line arguments, but which need to
be manually updated every time you change trading symbols
(i.e. if the minted total note falls out of sync due to an error)

You can run the following commands in pairs, alternating, several times,
to convince yourself that they are minting notes of the same token.

```
NODE_ENV=DEVELOPMENT scripts/mint.js
NODE_ENV=DEVELOPMENT node demo.js
```

## Mint and Confidential Transfer

There is an intermediate demo (with fixed test amounts) for
confidential minting followed by confidential transfer.

```
NODE_ENV=DEVELOPMENT node demo.js
```

## Test Failure

You can specify minting from zero with the `--mintFromZero true` option
which will cause an EVM revert if you are not minting from the first time.
This provides a sanity check that you are actually minting on the blockchain.

```
NODE_ENV=DEVELOPMENT node src/mint.js \
  --tradeSymbol AAA \
  --minteeAddress 0x1051Cd3F5D5f3E097713265732A10677C043CcEA \
  --minteePublicKey 0x04b56dcc4375e855adba8f37a2a9cce64809b3d24d1981daa7c9e3f98316676b06b27a85b889559c09ad442f2636491ceb6930589cee609258df8da29e852a1312 \
  --minteeAmount 22
  --mintFromZero true
```

## To Do

Add these in the Project Roadmap.

* Add instructions for how to get the (AZTEC) public key, perhaps with a command-line tool published in `demo-keys`
* Add instructions for how to generate a new account store it remotely on a Democracy REST server
