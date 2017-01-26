'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createModel = createModel;
exports.createModelBuffers = createModelBuffers;
exports.startObject = startObject;
exports.finishObject = finishObject;
exports.createMetadata = createMetadata;
exports.createVCoords = createVCoords;
exports.createVIndices = createVIndices;
exports.createVNormals = createVNormals;
exports.createItem = createItem;
exports.createComponent = createComponent;

var _parseHelpers = require('./parseHelpers');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

// everything in this module is to help build up data from the raw data
var assign = Object.assign;

function createModel(state, input) {
  var unit = input.unit,
      version = input.version,
      requiredExtensions = input.requiredExtensions,
      scale = input.scale;

  state.unit = unit;
  state.version = version;
  state.requiredExtensions = requiredExtensions;
  state.transforms = { scale: scale };
  return state;
}

function createModelBuffers(modelData) {
  // console.log("creating model buffers", modelData)//modelData, modelData._attributes)
  // other implementation
  var dataTypes = { 'positions': Float32Array, 'indices': Uint32Array, 'normals': Float32Array, 'colors': Float32Array };

  var output = ['positions', 'normals', 'colors'] // , "indices"]
  .reduce(function (result, key) {
    if (key in modelData._attributes) {
      var data = modelData._attributes[key];
      var dataBuff = new dataTypes[key](data.length);
      // console.log('key',key, data, dataBuff)

      dataBuff.set(data);

      result[key] = dataBuff;
    }
    return result;
  }, {});

  return output;
}

function startObject(state, input) {
  var tag = input.tag;


  var object = ['id', 'name', 'type', 'pid'].reduce(function (result, key) {
    if (key in tag.attributes) {
      result[key] = tag.attributes[key];
    }
    return result;
  }, {});

  //  metaType can be either 'object' or 'component'
  state.currentObject = assign({}, state.currentObject, object);
  return state;
}

function finishObject(state, input) {
  var object = state.currentObject;

  state.objects[object.id] = Object.assign({ id: object.id, name: object.name, type: object.type }, { geometry: createModelBuffers(object) }, { components: object.components });

  state.currentObject = {
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
  };
  return state;
}

function createMetadata(state, input) {
  var metadata = assign({}, state.metadata, input);
  state.metadata = metadata;
  return state;
}

function createVCoords(state, input) {
  var _state$currentObject$;

  var positions = state.currentObject.positions;
  var A = [positions[input[0] * 3], positions[input[0] * 3 + 1], positions[input[0] * 3 + 2]];
  var B = [positions[input[1] * 3], positions[input[1] * 3 + 1], positions[input[1] * 3 + 2]];
  var C = [positions[input[2] * 3], positions[input[2] * 3 + 1], positions[input[2] * 3 + 2]];

  // console.log("createVCoords", positions, A, B, C)
  (_state$currentObject$ = state.currentObject._attributes.positions).push.apply(_state$currentObject$, A.concat(B, C)); // state.currentObject._attributes.positions.concat(A).concat(B).concat(C)
  return state;
}

function createVIndices(state, input) {
  var _state$currentObject$2;

  (_state$currentObject$2 = state.currentObject._attributes.indices).push.apply(_state$currentObject$2, _toConsumableArray(input)); // = state.currentObject._attributes.indices.concat(input)
  return state;
}

function createVNormals(state, input) {
  var _state$currentObject$3;

  // see specs : A triangle face normal (for triangle ABC, in that order) throughout this specification is defined as
  // a unit vector in the direction of the vector cross product (B - A) x (C - A).
  // (B - A) x (C - A).
  var normalIndices = [input[0], input[1], input[2]];
  var positions = state.currentObject.positions;

  var A = [positions[input[0] * 3], positions[input[0] * 3 + 1], positions[input[0] * 3 + 2]];
  var B = [positions[input[1] * 3], positions[input[1] * 3 + 1], positions[input[1] * 3 + 2]];
  var C = [positions[input[2] * 3], positions[input[2] * 3 + 1], positions[input[2] * 3 + 2]];

  // console.log("indices",normalIndices,input[0], positions, "A",A,"B",B,"C",C)

  function cross(a, b) {
    var ax = a[0],
        ay = a[1],
        az = a[2];
    var bx = b[0],
        by = b[1],
        bz = b[2];

    var x = ay * bz - az * by;
    var y = az * bx - ax * bz;
    var z = ax * by - ay * bx;
    return [x, y, z];
  }
  function sub(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  function length(v) {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  }

  function multiplyScalar(v, s) {
    return [v[0] * s, v[1] * s, v[2] * s];
  }
  function divideScalar(vector, scalar) {
    return multiplyScalar(vector, 1 / scalar);
  }

  function normalize(v) {
    return divideScalar(v, length(v));
  }

  var normal = normalize(cross(sub(B, A), sub(C, A)));

  function assignAtIndex(target, startIndex, data) {
    for (var i = 0; i < 3; i++) {
      //console.log('assign', target, startIndex, data, data[i])
      target[startIndex + i] = data[i];
    }
  }

  function assignAllAtIndices(target, indices, data) {
    indices.forEach(function (cindex) {
      assignAtIndex(target, cindex * 3, data);
    });
  }

  (_state$currentObject$3 = state.currentObject._attributes.normals).push.apply(_state$currentObject$3, _toConsumableArray(normal).concat(_toConsumableArray(normal), _toConsumableArray(normal))); // state.currentObject._attributes.normals.concat(normal).concat(normal).concat(normal)

  return state;
}

function createItem(state, input) {
  var tag = input.tag;

  var item = ['objectid', 'transform', 'partnumber', 'path'].reduce(function (result, key) {
    // console.log('result', result)
    if (key in tag.attributes) {
      if (key === 'transform') {
        result['transforms'] = (0, _parseHelpers.matrixFromTransformString)(tag.attributes[key]); // .split(' ').map(t => parseFloat(t))
      } else {
        result[key] = tag.attributes[key];
      }
    }
    return result;
  }, {});
  state.build.push(item);

  if (item.path) {
    state.subResources.push(item.path);
  }
  return state;
}

function createComponent(state, input) {
  var tag = input.tag;

  var item = ['id', 'objectid', 'transform', 'path'] // FIXME: no clear seperation of specs, path is production spec
  .reduce(function (result, key) {
    // console.log('result', result)
    if (key in tag.attributes) {
      if (key === 'transform') {
        result['transforms'] = (0, _parseHelpers.matrixFromTransformString)(tag.attributes[key]);
      } else {
        result[key] = tag.attributes[key];
      }
    }
    return result;
  }, {});

  // state.objects[state.currentObject.id]= item
  state.currentObject.components.push(item);
  // console.log('createComponent', item)
}