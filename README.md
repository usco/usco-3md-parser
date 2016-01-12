## usco-3mf-parser

[![GitHub version](https://badge.fury.io/gh/usco%2Fusco-3mf-parser.svg)](https://badge.fury.io/gh/usco%2Fusco-3mf-parser)

3mf format parser for USCO project

originally based on THREE.js STL parser, but rather extensively modified.
(not dependenant, or using three.js anymore)

Optimized for speed in the browser (webworkers etc)



## General information

  - returns raw buffer data wrapped in an RxJs observable (soon to be most.js)
  - useable both on Node.js & client side 


## Usage 

  
import parse,  {outputs} from '../lib/3mf-parser'

let data = fs.readFileSync("mesh.3mf")

let threemfObs = parse(data) //we get an observable back

threemfObs.forEach(function(parsedSTL){
  //DO what you want with the data wich is something like {vertices,normals,etc}
  console.log(parsedSTL) 
})



## LICENSE

[The MIT License (MIT)](https://github.com/usco/usco-3mf-parser/blob/master/LICENSE)

- - -

[![Build Status](https://travis-ci.org/usco/usco-3mf-parser.svg?branch=master)](https://travis-ci.org/usco/usco-3mf-parser)
[![Dependency Status](https://david-dm.org/usco/usco-3mf-parser.svg)](https://david-dm.org/usco/usco-3mf-parser)
[![devDependency Status](https://david-dm.org/usco/usco-3mf-parser/dev-status.svg)](https://david-dm.org/usco/usco-3mf-parser#info=devDependencies)