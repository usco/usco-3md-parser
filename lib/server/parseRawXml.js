'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = parseRawXml;

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var sax = require('sax');

// input can be a stream ?
function parseRawXml(input) {
  return _rx2.default.Observable.create(function (parsedData) {
    function onTagOpen(tag) {
      // console.log("onTagOpen",tag)
      parsedData.onNext({ tag: tag, start: true });
    }

    function onTagClose(tag) {
      // console.log("onTagClose",tag)
      if (!tag.name) {
        tag = { name: tag };
      }
      parsedData.onNext({ tag: this._parser.tag, end: true });
    }

    function onTagText(text) {
      // console.log("text",text)//, this._parser.tag)
      parsedData.onNext({ tag: this._parser.tag, text: text });
    }

    var saxStream = sax.createStream(true, { trim: true });

    // console.log("saxStream",saxStream)
    saxStream.on('error', function (e) {
      // unhandled errors will throw, since this is a proper node
      // event emitter.
      console.error('error!', e);
      // clear the error
      this._parser.error = null;
      this._parser.resume();
    });
    saxStream.on('opentag', onTagOpen);
    saxStream.on('closetag', onTagClose);
    saxStream.on('text', onTagText);

    saxStream.on('ready', function () {
      console.log('ready');
    });

    // split up stream
    /* let length = input.length
    let chunkedLength = 0
    let chunkSize     = 300 //length
    let chunk         = ""
    let c = 0
    saxStream.on("ready",function(){
      if( chunkedLength < length)
      {
        chunk = input.slice(chunkedLength, chunkedLength += chunkSize)
        saxStream.write( chunk ).close()
      }
    })
     chunk = input.slice(chunkedLength, chunkedLength += chunkSize)
    saxStream.write( chunk ).close()*/
    saxStream.write(input);

    return function () {
      console.log('disposed');
    };
  });
}