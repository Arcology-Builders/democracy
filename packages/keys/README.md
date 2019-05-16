Democracy.js Keys
=================

The package `demo-keys` of the Democracy.js framework manages
key management, especially the enciphering, deciphering, storage, and retrieval of
Ethereum private keys. It also includes transaction signing, which is the
chief activity of a private key.

We make use of the `keythereum` project from ethereumjs and `ethjs-signer`.

Account
=======

The key concept in `demo-keys` is an *account*, an Immutable Map which contains
the following members

* privateBuffer
* publicBuffer
* addressBuffer
* ivBuffer
* saltBuffer

Wallet
======

Just like a wallet is a container for your credit cards and physical ID cards
(not your metal house/car keys, the analogy is not perfect), a *wallet* in
`demo-keys` is a top-level manager for your Ethereum private keys.

A wallet is a singleton and exists only in-memory.
You only ever import and use one in any program.

```
const { wallet } = require('demo-keys')
```

It manages four basic functions:

* Enciphering an account to a geth-compatible JSON form with a String password.
  Also known as "locking."
* Deciphering an account from a geth-compatible JSON form with a String password
  Also known as "unlocking."
* Storing the JSON form
* Retrieving the JSON form

It also contains three convenience methods, which can be done in other ways
but are included here in an easy-to-use format.

* Transferring ETH from one account (possibly a test account) to another
* Creating a transaction signer (a signerEth) that uses a single account and its
  funds to sign and broadcast transactions to an Ethereum network.

A wallet contains the following state:

## Initialization

Before using a wallet for the first time, it should be initialized. This
connects it to a key-value store, possibly remotely, where all persistent data is
stored.

## Accounts Map

```
accountsMap: `0x`-prefixed Ethereum address strings => ( account | enciphered JSON )
```

The accounts map associates to an Ethereum address one of two objects: a
deciphered / unlocked account ready for tx signing, or an enciphered / locked
JSON that has been retrieved / created and is waiting to be unlocked.

## Signers Map

The deciphered account form is the one that is needed to sign transactions and
spend funds. A signerEth is a `web3` network object (such as provided by `ethjs`
or `web3` although the actual methods provided vary)

```
signersMap: `0x`-prefixed Ethereum address strings => a signerEth
```

The signers map associated to an Ethereum address a signerEth that uses that
address (and its private key if it's unlocked) to sign transactions. The signerEth
is passed to deployers, for example, instead of the default configured `eth` from
`getNetwork()`, which will only allow test accounts.

Usage Notes
===========

The typical workflow in using a wallet is to first initialize it,
telling it to connect to the configured key-value store.

```
await wallet.init({ autoConfig, unlockSeconds })
```

```
await wallet.loadEncryptedAccount({ address })
```

```
await wallet.unlockEncryptedAccount({ address })
```

```
const { address, password, signerEth } = await createSignerEth({
  autoCreate: boolean,
  address: string,
  password: string,
})
```

Future Improvements
===================

Currently `demo-keys` uses `setTimeout` to set a callback in the future to relock an
account. A program will not exit as long as `setTimeout` functions are outstanding.
It would be a useful design change in the future to keep more state, such as the
relock function IDs, and have a `wallet.shutdown` API method that relocks all unlocked
accounts and then calls `cancelTimeout` on all the callbacks. 
