Democracy Build Experiment
==========================

The current build system uses minimal `lerna` to set up
a mono-repo structure, but all the heavy-lifting is
done by `npm` in each package
to install and resolve package dependencies,
mantaining lock files, and running tests and other scripts.

Lerna creates symlinks between inter-dependent packages in
the same monorepo automatically on `lerna bootstrap`
Occasionally, new packages are added, and we may need to
bootstrap again to get these symlinks added.

In this document we describe the shortcomings to this approach,
and proposed experiments with new tools and workflows to
improve the developer experience, and make Democracy fun again :)

We are following guidelines found in
[article by Trabe](https://medium.com/trabe/monorepo-setup-with-lerna-and-yarn-workspaces-5d747d7c0e91)

## Shortcomings

This approach has worked well to bring Democracy.js to its
current state, with 10 small modules (< 20kb published,
and in most cases < 10kb) with minimal dependencies
among each other.

However, it has introduced the main shortcoming now
that much development time is spent on manually bumping
version numbers, fixing tests, and fixing `npm install`
dependency resolution.

This slowness 

There are two other conflicting approaches that make
this workflow difficult.

1. Wishing to use published `npm` package versions for
   reproducibility, and to isolate breaking changes in
   one package from another.
1. Using relative `file:../../../...` versions in `npm` dependencies.
   This appears to install symlinks as well, but switching
   back and forth to normal `x.x.x` version numbers
   sometimes causes resolution / file-not-found errors

## Proposed Solution

We propose solving these shortcomings by
* Improving our workflow, by resolving all breaking changes
  across all packages in every commit, and making sure all
  tests pass on every commit, in true monorepo style.
* Using better tools, namely trying `yarn` and `bazel`,
  with better performance and caching.

## Measurements

Because performance and responsiveness is key, here are some
numbers to compare `npm` and `yarn` on a MacBook Air 2013.

`yarn-1.15.2`
`npm-6.7.0`

Taking the median of three measurements.

### Disk Space Measurements

After `npm install`
```
--- /src/democracy/packages --------------
                         /..
  145.4 MiB [##########] /webify
  111.3 MiB [#######   ] /keys
   91.1 MiB [######    ] /tools
   71.8 MiB [####      ] /rest
   69.9 MiB [####      ] /timely-resource
   43.4 MiB [##        ] /democracy.js
   26.0 MiB [#         ] /utils
   25.8 MiB [#         ] /compile
   25.5 MiB [#         ] /contract
   12.8 MiB [          ] /tx
   56.0 KiB [          ] /test-contracts
```

### `@democracy.js/webify` version `0.0.3`

|                   | no `node_modules` | `node_modules` |
|-------------------|-------------------|----------------|
| npm (cold cache)  | 57.038s           | 10.39s         |
| npm (warm cache)  | 48.199s           | 9.166s         |
| yarn (cold cache) | 64.90s            | 0.81s          |
| yarn (warm cache) | 42.48s            | 0.82s          |
| bazel             |                   |                |

### `@democracy.js/rest` version `0.0.6`


|                   | no `node_modules` | `node_modules` |
|-------------------|-------------------|----------------|
| npm (cold cache)  | 28.064s           | 4.797s         |
| npm (warm cache)  | 21.414s           | 4.4s           |
| yarn (cold cache) | 28.56s            | 0.57s          |
| yarn (warm cache) | 15.67s            | 0.58s          |
| bazel             |                   |                |
