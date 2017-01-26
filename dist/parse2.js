'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = parse;

var _specCore = require('./specCore');

var _specMaterials = require('./specMaterials');

var sax = require('sax');

function parse(_ref) {
  var callback = _ref.callback,
      isRoot = _ref.isRoot;

  var state = Object.assign({}, (0, _specCore.makeStateExtras)(), (0, _specMaterials.makeStateExtras)());
  var xmlStream = sax.createStream(true, { trim: true });

  function processData(data) {
    // deal with core data
    (0, _specCore.detectAndCreate_Core)(state, data);
    // deal with materials and colors
    (0, _specMaterials.detectAndCreate_Materials)(state, data);
  }

  function onTagOpen(tag) {
    processData({ tag: tag, start: true });
  }
  function onTagClose(tag) {
    if (!tag.name) {
      tag = { name: tag };
    }
    processData({ tag: this._parser.tag, end: true });
  }
  function onTagText(text) {
    processData({ tag: this._parser.tag, text: text });
  }
  function onParseEnd() {
    callback(state);
    state = undefined;
  }

  xmlStream.on('opentag', onTagOpen);
  xmlStream.on('closetag', onTagClose);
  xmlStream.on('text', onTagText);
  xmlStream.on('end', onParseEnd);

  return xmlStream;
}