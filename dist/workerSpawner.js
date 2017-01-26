'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = workerSpawner;

var _WorkerStream = require('./WorkerStream');

var _WorkerStream2 = _interopRequireDefault(_WorkerStream);

var _WebWorkify = require('WebWorkify');

var _WebWorkify2 = _interopRequireDefault(_WebWorkify);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function workerSpawner() {
  var worker = (0, _WebWorkify2.default)(require('./worker.js'));
  var ws = new _WorkerStream2.default({ path: worker });
  return ws;
}