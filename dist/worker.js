'use strict';

var _parse = require('./parse');

var _parse2 = _interopRequireDefault(_parse);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function (self) {
  var streamParser = (0, _parse2.default)(function (data) {
    //console.log('done with parsing', data)
    self.postMessage(data);
    self.postMessage(null);
  });

  /*streamParser.on('data', function (data) {
    console.log('data from streamParser', data)
  })
   streamParser.on('error', function (err) {
    console.log('error', err)
  })
   streamParser.on('finish', function (err) {
    console.log('finish', err)
  })*/

  self.onmessage = function (event) {
    //console.log('message into worker', event)
    if (event.data === 'end') {
      streamParser.end();
    } else {
      streamParser.write(Buffer(event.data));
    }
    // self.postMessage(Buffer(event.data))
    // stlStreamParser(Buffer(event.data), null, (err, data) => self.postMessage(data.buffer, [data.buffer]))
  };
};