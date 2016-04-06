'use strict';

var _assemble = require('./assemble');

var _assemble2 = _interopRequireDefault(_assemble);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

self.onmessage = function (event) {
  var data = event.data;
  data = data.data;

  (0, _assemble2.default)(data).subscribe(function (data) {
    if (data._finished === true) {
      self.postMessage({ data: data });
      self.close();
    }
  });
};