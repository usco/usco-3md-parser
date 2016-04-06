'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mergeData = mergeData;
exports.applyDefaults = applyDefaults;
exports.applyTransform = applyTransform;
exports.makeModifications = makeModifications;
exports.makeModel = makeModel;

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

var _assign = require('fast.js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var merge = _rx2.default.Observable.merge;
var just = _rx2.default.Observable.just;

// faster object.assign

// TODO: this needs to be an external lib, for re-use
// merge the current data with any number of input data
function mergeData(currentData) {
  for (var _len = arguments.length, inputs = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    inputs[_key - 1] = arguments[_key];
  }

  if ('merge' in currentData) {
    return currentData.merge(inputs);
  }
  return _assign2.default.apply(undefined, [{}, currentData].concat(inputs));
}

// need to make sure source data structure is right
function applyDefaults(data$, defaults) {
  return data$.map(function (data) {
    return mergeData(defaults, data);
  });
}

// need to make sure the "type" (immutable) is right
function applyTransform(data$, transform) {
  return data$.map(function (data) {
    return transform(data);
  });
}

function makeModifications(actions, updateFns, options) {
  var mods$ = Object.keys(actions).map(function (key) {
    var op = actions[key];
    var opName = key.replace(/\$/g, '');
    var modFn = updateFns[opName];

    // here is where the "magic happens"
    // for each "operation/action" we map it to an observable with history & state
    var mod$ = op.map(function (input) {
      return function (state) {
        state = modFn(state, input); // call the adapted function
        return state;
      };
    });

    if (modFn) {
      return mod$;
    }
  }).filter(function (e) {
    return e !== undefined;
  });

  return merge(mods$);
}

function makeModel(defaults, updateFns, actions, source) {
  var options = arguments.length <= 4 || arguments[4] === undefined ? { doApplyTransform: false } : arguments[4];

  var mods$ = makeModifications(actions, updateFns, options);

  var source$ = source || just(defaults);

  source$ = applyDefaults(source$, defaults);

  if (options.doApplyTransform) {
    source$ = applyTransform(source$, transform);
  }

  return mods$.merge(source$).scan(function (currentData, modFn) {
    return modFn(currentData);
  }); // combine existing data with new one
  // .distinctUntilChanged()
}