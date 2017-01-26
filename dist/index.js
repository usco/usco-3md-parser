'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = makeParsedStream;

var _compositeDetect = require('composite-detect');

var _compositeDetect2 = _interopRequireDefault(_compositeDetect);

var _workerSpawner = require('./workerSpawner');

var _workerSpawner2 = _interopRequireDefault(_workerSpawner);

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

var _parse = require('./parse');

var _parse2 = _interopRequireDefault(_parse);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
// import makeStreamParser from './parseStream'


/**
 * @author kaosat-dev / https://github.com/kaosat-dev
 *
 * Description: A streaming (node.js streams) parser for 3MF files
 * Optimised both for speed and low memory consumption
 *
 *
 * Limitations:
 *
**/

function wrapper() {
  var Duplex = require('stream').Duplex;

  var Outer = function (_Duplex) {
    _inherits(Outer, _Duplex);

    function Outer() {
      _classCallCheck(this, Outer);

      var _this = _possibleConstructorReturn(this, (Outer.__proto__ || Object.getPrototypeOf(Outer)).call(this, { readableObjectMode: true }));

      _this.streamParser = (0, _parse2.default)(function (data) {
        return _this.push(data);
      });
      _this.on('finish', function () {
        return _this.streamParser.end();
      });
      return _this;
    }

    _createClass(Outer, [{
      key: '_read',
      value: function _read(size) {}
    }, {
      key: '_write',
      value: function _write(chunk, encoding, callback) {
        this.streamParser.write(Buffer(chunk));
        callback();
      }
    }]);

    return Outer;
  }(Duplex);

  return new Outer();
}
/**
 * parses and return a stream of parsed 3mf data
 * @param {Object} parameters parameters for the parser
 * @param {Boolean} parameters.useWorker use web workers (browser only) defaults to true in browser
 * @return {Object} stream of parsed 3mf data in the form {}
 */
function makeParsedStream() {
  var parameters = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var defaults = {
    useWorker: _compositeDetect2.default.isBrowser === true
  };
  parameters = Object.assign({}, defaults, parameters);
  var _parameters = parameters,
      useWorker = _parameters.useWorker;


  return useWorker ? (0, _workerSpawner2.default)() : wrapper();
}