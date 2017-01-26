'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.detectAndCreate_Core = detectAndCreate_Core;
exports.makeStateExtras = makeStateExtras;
exports.getScaleFromUnit = getScaleFromUnit;
exports.extractModelData = extractModelData;
exports.extractMetadata = extractMetadata;
exports.vertexCoordinate = vertexCoordinate;
exports.vertexIndices = vertexIndices;
exports.component = component;

var _parseHelpers = require('./parseHelpers');

var _specCoreCreate = require('./specCoreCreate');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function detectAndCreate_Core(state, data) {
  if (data.tag.name === 'model') {
    (0, _specCoreCreate.createModel)(state, extractModelData(data));
  } else if (data.tag.name === 'metadata' && data.text) {
    (0, _specCoreCreate.createMetadata)(state, extractMetadata(data));
  } else if (data.tag.name === 'object' && data.start) {
    (0, _specCoreCreate.startObject)(state, data);
  } else if (data.tag.name === 'object' && data.end) {
    (0, _specCoreCreate.finishObject)(state, data);
  } else if (data.tag.name === 'vertex' && data.start) {
    var _state$currentObject$;

    (_state$currentObject$ = state.currentObject.positions).push.apply(_state$currentObject$, _toConsumableArray(vertexCoordinate(data)));
  } else if (data.tag.name === 'triangle' && data.start) {
    var vertexIndicesR = vertexIndices(data);
    (0, _specCoreCreate.createVIndices)(state, vertexIndicesR);
    (0, _specCoreCreate.createVNormals)(state, vertexIndicesR);
    (0, _specCoreCreate.createVCoords)(state, vertexIndicesR);
  } else if (data.tag.name === 'item' && data.start) {
    (0, _specCoreCreate.createItem)(state, data);
  } else if (data.tag.name === 'component' && data.end) {
    (0, _specCoreCreate.createComponent)(state, data);
  } else if (data.tag.name === 'build' && data.end) {
    state._finished = true;
  }
}

// any piece of state that needs to be added by this specific spec
function makeStateExtras() {
  return {
    metadata: {},
    objects: {},
    build: [],
    currentObject: {
      id: undefined,
      name: undefined,
      components: [],

      positions: [],
      _attributes: {
        positions: [],
        normals: [],
        indices: [],
        colors: []
      }
    },
    resources: {},
    subResources: [] // this is for anything that needs async resolving
  };
}

// All helpers after this point
function getScaleFromUnit(self) {
  var unit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'millimeter';

  var mapping = {
    'micron': 0.001,
    'millimeter': 1,
    'centimeter': 10,
    'meter': 1000,
    'inch': 25.4,
    'foot': 304.8
  };
  var scale = mapping[unit];
  if (scale === undefined) {
    console.warn('Unrecognised unit ' + unit + ' used. Assuming mm instead');
    scale = 1;
  }
  return [scale, scale, scale];
}

function extractModelData(data) {
  var tag = data.tag;

  var unit = tag.attributes['unit'];
  var scale = getScaleFromUnit(unit);
  var version = tag.attributes['version'];
  var requiredExtensions = tag.attributes['requiredextensions'];
  requiredExtensions = requiredExtensions ? requiredExtensions.split('') : [];
  return { unit: unit, version: version, requiredExtensions: requiredExtensions, scale: scale };
}

function extractMetadata(data) {
  var tag = data.tag,
      text = data.text;


  var name = tag.attributes['name'];
  var value = text;
  var result = {};
  result[name] = value;
  return result;
}

function vertexCoordinate(data) {
  var tag = data.tag;

  var vertexCoords = (0, _parseHelpers.parseVector3)(tag);
  return vertexCoords;
}

function vertexIndices(data) {
  var tag = data.tag;

  var vertexIndices = (0, _parseHelpers.parseIndices)(tag);
  return vertexIndices;
}

function component(data) {
  var tag = data.tag;

  return ['objectid', 'transform'].reduce(function (result, key) {
    if (key in tag.attributes) {
      result[key] = tag.attributes[key];
    }
    return result;
  }, {});
}