'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = parse;

var _assign = require('fast.js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

var _assemble = require('./assemble');

var _assemble2 = _interopRequireDefault(_assemble);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var detectEnv = require('composite-detect');

// TODO: we need to modify the way Jam handles the data , as we do not only return a single geometry/mesh but
// a full hierarchy etc
function parse(data) {
  var parameters = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  var defaults = {
    useWorker: detectEnv.isBrowser === true
  };
  parameters = (0, _assign2.default)({}, defaults, parameters);
  var _parameters = parameters;
  var useWorker = _parameters.useWorker;


  var obs = new _rx2.default.ReplaySubject(1);

  if (useWorker) {
    (function () {
      var worker = new Worker('./worker.js'); // browserify

      worker.onmessage = function (event) {
        obs.onNext(event.data.data);
        obs.onNext({ progress: 1, total: Math.NaN });
        obs.onCompleted();
      };
      worker.onerror = function (event) {
        obs.onError('error: ' + event.message);
      };

      worker.postMessage({ 'data': data });

      obs.catch(function (e) {
        return worker.terminate();
      });
    })();
  } else {
    (0, _assemble2.default)(data)
    /* .last(function (data, idx, obs) {
      return data._finished === true
    })*/ // WHY U NO WORK ??
    .subscribe(function (data) {
      if (data._finished === true) {
        obs.onNext({ progress: 1, total: Math.NaN });
        obs.onNext(data);
        obs.onCompleted();
      }
    });
  }

  return obs;
}