democracy
=========

Tools for running a country on Ethereum.

REPL
=======

To experiment with and administer Ethereum contracts, it's useful to have a central
console able to attach to any JSONRPC endpoint, whether it's on the mainnet or one
of the third-generation testnets (Ropsten, Kovan, or the upcoming Rinkeby).

Use `preamble.js` to include some boilerplate JSONRPC connection code, which
connects to Kovan on `localhost:8546` by default.

```
node -i -e "web3 = require('./preamble')().web3"
```

An example session looks like:

```
$ node -i -e "web3 = require('./preamble')().web3"
> Coinbase: 0x80aff102f5bda839483f529e5ca605b8b6b45658
Usage: node -i console.js [network]
Net: undefined
kovan
> web3.eth.accounts
[ '0x00167d7f67f0e2af7580a771d713267c4042d643',
  '0x9025d8a37da2d7c302ef3bd7a6ff65c3a5c37020',
  '0xe8e6b09c730ffd235d15fff0c3751c20d858c306' ]
> web3.eth.getBalance(web3.eth.coinbase)
{ [String: '0'] s: 1, e: 0, c: [ 0 ] }
>
```
