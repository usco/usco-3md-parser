'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeStateExtras = makeStateExtras;
exports.extensions = extensions;
function makeStateExtras() {
  return {};
}

function extensions() {
  //what other fields to fetch from what elements
  return {
    item: ['part']
  };
}