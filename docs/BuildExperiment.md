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

### Top-Level Bootstrap Time and Disk Space

#### Lerna Bootstrap with NPM

After `lerna bootstrap` with `npm install`
```
--- /src/democracy/packages --------------

  139.0 MiB [##########] /webify
  111.3 MiB [########  ] /keys
   95.2 MiB [######    ] /tools
   69.9 MiB [#####     ] /timely-resource
   53.4 MiB [###       ] /rest
   43.4 MiB [###       ] /democracy.js
   26.0 MiB [#         ] /utils
   25.8 MiB [#         ] /compile
   12.8 MiB [          ] /tx
    9.7 MiB [          ] /contract
   56.0 KiB [          ] /test-contracts
```
#### Lerna Bootstrap with NPM Production

After `lerna bootstrap` with `npm install --production`

```
--- /src/democracy/packages --------------
303.1 MiB [##########] /packages
   70.4 MiB [##########] /webify
   70.1 MiB [######### ] /timely-resource
   46.9 MiB [######    ] /keys
   42.3 MiB [######    ] /democracy.js
   25.0 MiB [###       ] /utils
   17.0 MiB [##        ] /compile
   12.8 MiB [#         ] /tx
    9.5 MiB [#         ] /rest
    8.6 MiB [#         ] /contract
  492.0 KiB [          ] /tools
   56.0 KiB [          ] /test-contracts
```

Time: `2m2.398s`

#### Lerna Bootstrap with Yarn Development

After `lerna bootstrap` with `yarn install`
```
--- /src/democracy/packages -------------
  687.8 MiB [##########] /packages
  186.5 MiB [##########] /timely-resource
  137.1 MiB [#######   ] /webify
   98.3 MiB [#####     ] /keys
   91.3 MiB [####      ] /tools
   54.6 MiB [##        ] /rest
   45.4 MiB [##        ] /democracy.js
   25.9 MiB [#         ] /compile
   25.3 MiB [#         ] /utils
   13.6 MiB [          ] /tx
    9.8 MiB [          ] /contract
   56.0 KiB [          ] /test-contracts
```
Time: `3m4.968s`

#### Lerna Bootstrap with Yarn Production
After `lerna bootstrap` with `yarn install --production`

```
--- /src/democracy/packages ----------------
424.5 MiB [##########] /packages
  186.5 MiB [##########] /timely-resource
   72.5 MiB [###       ] /webify
   47.6 MiB [##        ] /keys
   44.3 MiB [##        ] /democracy.js
   24.2 MiB [#         ] /utils
   17.1 MiB [          ] /compile
   13.6 MiB [          ] /tx
    9.4 MiB [          ] /rest
    8.6 MiB [          ] /contract
  616.0 KiB [          ] /tools
   56.0 KiB [          ] /test-contracts
```
Time: `3m14.997s`

#### Lerna Bootstrap with Yarn Workspaces

And the clear winner.
```
 185.1 MiB [##########] /node_modules
   75.6 MiB [####      ] /wip
   48.5 MiB [##        ] /packages
   28.4 MiB [#         ] /.git
    1.7 MiB [          ] /dist
  584.0 KiB [          ] /web
  300.0 KiB [          ]  yarn.lock
  124.0 KiB [          ] /docker
   96.0 KiB [          ] /dapps
   76.0 KiB [          ] /contracts
   48.0 KiB [          ] /html
   24.0 KiB [          ] /scripts
   20.0 KiB [          ] /db
   16.0 KiB [          ] /keys
   12.0 KiB [          ] /specs
    8.0 KiB [          ]  .DS_Store
    8.0 KiB [          ]  README.md
    4.0 KiB [          ] /docs
    4.0 KiB [          ] /scratch
    4.0 KiB [          ] /.vscode
    4.0 KiB [          ]  package.json
    4.0 KiB [          ]  .gitignore
    4.0 KiB [          ]  test.sh
    4.0 KiB [          ] /.circleci
    4.0 KiB [          ]  .eslintrc.json
    4.0 KiB [          ]  lerna.json
```

```
-- /Users/ppham/src/blockchain/democracy/packages --
   27.8 MiB [##########] /webify
    8.9 MiB [###       ] /democracy.js
    5.9 MiB [##        ] /keys
    2.4 MiB [          ] /compile
    1.4 MiB [          ] /rest
  884.0 KiB [          ] /contract
  464.0 KiB [          ] /tx
  272.0 KiB [          ] /timely-resource
  224.0 KiB [          ] /tools
  120.0 KiB [          ] /depart
  116.0 KiB [          ] /utils
   52.0 KiB [          ] /test-contracts
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
