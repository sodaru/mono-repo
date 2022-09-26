# Sodaru Mono Repo

Sodaru Mono repo Utility

## Overview

Mono repos helps to build the related packages in single git repos

`lerna` is the opensource tool used to maintain npm mono-repos. lerna is not maintained actively and has not suppport for peer dependencies

This tool contains the subset of features from `lerna` and some extra features

## Installation

```bash
npm i npm-mono-repo
```

## Usage

```bash
mono-repo -h
```

### Common Options

```bash
mono-repo <command> [-p|--packages package1 package2 package3 ...] [-v|--verbose]
```

#### **packages** (package-filters)

The `command` applies to selected packages only.
If no packages is provided, all packages are considered

#### **verbose**

Prints verbose log to std out

### Commands

#### **1. install**

```bash
mono-repo install [--save | --save-dev | --save-peer] [<package-filters>] [-v] [-d|--dependencies [pkg1 pkg2 ...]]
```

install npm packages to packages in the mono-repo

##### **Options**

- `[-d|--dependencies [pkg1 pkg2 ...]]` ( _Optional_ ) Name of the packages tobe installed

  - if no packages provided this is similar to `npm i`
  - if package name is one if the package in mono-repo , then it is `symlink`ed
  - if `package.json` contains the a package from mono-repo, it is always `symlink`ed

- `[--save | --save-dev | --save-peer]` ( _Optional_ ) Save the packages as dependencies or devDependencies or peerDependencies

  - no support for `optional` or `bundled` dependencies

#### **2. clean**

```bash
mono-repo clean [<package-filters>] [-v]
```

delete node_modules and package-lock.json from every (or selected) package

#### **3. create**

```bash
mono-repo create [-v] <packageDirName>
```

creates a new package at `packagesDir/packageDirName`

##### **Options**

- `packageDirName` ( _**Required**_ ) Name of the directory to be created for the package

#### **4. run**

```bash
mono-repo run [<package-filters>] [-v] <npm-script> [<npm-script-args>]
```

Runs the npm script in every (or selected) package (**In the 'dependency first' order**)

> IMP NOTE: Skips if package does not have `script` to run

##### **Options**

- `npm-script` ( _**Required**_ ) Name of the script to be run

- `[<npm-script-args>]` ( _Optional_ ) list of args to be passed to `npm run` command

#### **5. version**

```bash
mono-repo version [<package-filters>] [-v]
```

Applies root package version to all (or selected) child packages, and updates the symlinked dependency's version

To be used in `version` script of the root package to pipeline the version change from root to child packages.

> IMP NOTE: Lifecycle scipts `preversion`, `version`, `postversion` are not run

#### **6. publish**

```bash
mono-repo publish [-v]
```

Runs `npm publish` on all child packages (**In the 'dependency first' order**) whose version matches with the root package.

- skips `private` packages

#### **7. init**

```bash
mono-repo init [-v]
```

initializes mono repo , by adding required scripts to root package

## Support

This project is a part of the Open Source Initiative from [Sodaru Technologies](https://sodaru.com)

Write an email to opensource@sodaru.com for queries on this project
