# usco-3mf-parser

[![GitHub version](https://badge.fury.io/gh/usco%2Fusco-3mf-parser.svg)](https://badge.fury.io/gh/usco%2Fusco-3mf-parser)

[![Build Status](https://travis-ci.org/usco/usco-3mf-parser.svg?branch=master)](https://travis-ci.org/usco/usco-3mf-parser)
[![Dependency Status](https://david-dm.org/usco/usco-3mf-parser.svg)](https://david-dm.org/usco/usco-3mf-parser)
[![devDependency Status](https://david-dm.org/usco/usco-3mf-parser/dev-status.svg)](https://david-dm.org/usco/usco-3mf-parser#info=devDependencies)

> [3mf](https://en.wikipedia.org/wiki/3D_Manufacturing_Format) format parser for USCO project

- Optimized for speed (webworkers)
- low memory consumption (streams)
- works in the Node.js & browser


## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [API](#api)
- [Contribute](#contribute)
- [License](#license)


## Install


```
npm i @usco/3mf-parser
```

## Usage


```JavaScript
  import makeParsedStream from '@usco/3mf-parser'

  fs.createReadStream('./someFile.3mf', { encoding: null}) // 'binary'
    .pipe(makeParsedStream())
    .on('data', function (parsed) {
      console.log('parsed', parsed)
      //DO what you want with the data
    })
```


## API


## Contribute

See [the contribute file](contribute.md)!

PRs accepted.

Small note: If editing the Readme, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

[![JavaScript Style Guide](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)s

## License

[MIT © Mark Moissette](./LICENSE)
