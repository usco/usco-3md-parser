'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = unpack;

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var JSZip = require('jszip');

var from = _rx2.default.Observable.from;

function toBuffer(ab) {
  var buffer = new Buffer(ab.byteLength);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buffer.length; ++i) {
    buffer[i] = view[i];
  }
  return buffer;
}

// not really streaming...yet
function streamZipData(arrayBuffer, obs) {
  if (typeof Blob !== 'undefined') {
    // browser land
    var blob = new Blob([arrayBuffer]);
    var reader = new FileReader();

    reader.onload = function (e) {
      var txt = e.target.result;
      obs.onNext(txt);
    };
    reader.readAsText(blob);
  } else {
    // node land
    // let fs = require('fs')
    var buffer = toBuffer(arrayBuffer);
    obs.onNext(ensureString(buffer));
  }
}

// TODO this needs to stream the data
function unpack(data) {
  var zip = new JSZip(data);
  // console.log("entries", zip.files)
  var entries$ = from(Object.keys(zip.files).map(function (key) {
    return zip.files[key];
  }));

  return entries$.filter(function (entry) {
    return entry !== undefined;
  }).filter(function (entry) {
    return entry._data !== null;
  }).filter(function (entry) {
    return entry.dir === false;
  }).filter(function (entry) {
    return entry.name.startsWith('3D/');
  }).flatMap(function (entry) {
    var result = new _rx2.default.ReplaySubject(1);
    var ab = entry.asArrayBuffer();
    streamZipData(ab, result);
    return result;
  }).catch(function (error) {
    // console.log("error",error)
    var formated = ensureString(data); // why do we use this ?
    return formated;
  });
}

function ensureString(buf) {
  if (typeof buf !== 'string') {
    var array_buffer = new Uint8Array(buf);
    var str = '';
    for (var i = 0; i < buf.byteLength; i++) {
      str += String.fromCharCode(array_buffer[i]); // implicitly assumes little-endian
    }
    return str;
  } else {
    return buf;
  }
}