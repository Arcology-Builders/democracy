## Public Democracy + AZTEC demo

See Democracy + AZTEC in action using our public server.

### Checkout and Install
```
git clone git@github.com:invisible-college/demo-aztec.git 
cd demo-aztec
yarn
cp RENAME_ME.env .env
```

This will install NodeJS dependencies.
We've already deployed an AZTEC asset identified by the symbol `AAA`.

### Minting / Issuing

You can mint like so

```
NODE_ENV=TEST ./scripts/mint.js AAA 22
```
Now you have 22 shiny new encrypted tokens for asset `AAA,
issued to the test address in the `.env` file with the
line

```
TEST.DEPLOYER_ADDRESS=
```

You can mint as many times as you like, with arbitrarily large amounts
(up to the AZTEC limit of  1,000,000 or so). Each time, you'll get a
`noteHash` on the console output, right before `Minting complete.`.

```
> [mint][info]"Successfully deposited 22 to mintee"
> 0x3d3a287dfc9be8265ea6685460db085de1f4da4aacd53b2678a90d072584b18f
> Minting complete.
```

This is a unique identifier for the newly minted note (think of it like
the serial number on a USD bill or other favorite fiat).

### Confidential Transfer

You can now transfer part or all of this note to any arbitrary Ethereum
address (if you omit the receiver, we use the address in the `.env`
file named `TEST_ADDRESS_1`.

The sender note hash from the minting we wanted to use above is
`0x3d3a287dfc9be8265ea6685460db085de1f4da4aacd53b2678a90d072584b18f` so
we plug it into this command.

```
NODE_ENV=TEST ./scripts/cx.js AAA 0x3d3a287dfc9be8265ea6685460db085de1f4da4aacd53b2678a90d072584b18f 22
```

If you try to run this command a second time with the same arguments,
it will fail because you can successfully transfer an AZTEC note exactly once.

### What's Next?

After several rounds of doing minting and confidential transfer, you may be
curious what's next.

Minting and transferring AZTEC tokens are specific examples of a Democracy flow,
a pipeline of reproducible, immutable transformations that pass state in a one-way direction,
caches the state after each transformation, and automatically refreshes all successive transformation
when an upstream state changes.

Democracy flows are now available in your web browser,
so that you can write web pages (e.g. with React) that calls the exact
same Javascript code above, removing the need to learn, call, or implement
different clients for two different APIs (web and command-line).

Soon we'll add a link to a web demo here, which you can try out without
downloading and installing any software.

Try our web demo to run the above minting and confidential transfer
without the need to download or install any software.

(http://demo-aztec.herokuapp.com)[http://demo-aztec.herokuapp.com]

We'll record a screencast with a step-by-step walkthrough here soon.

If you have any questions, feedback, problems, or want to get involved,
reach out on Gitter!

[![Gitter](https://badges.gitter.im/invisible-college/democracy.svg)](https://gitter.im/invisible-college/democracy?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
