'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = assemble;

var _assign = require('fast.js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _unpack = require('./unpack');

var _unpack2 = _interopRequireDefault(_unpack);

var _parseRawXml = require('./parseRawXml');

var _parseRawXml2 = _interopRequireDefault(_parseRawXml);

var _parseHelpers = require('./parseHelpers');

var _modelHelpers = require('./modelHelpers');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function threeMFInfo(data) {
  var tag = data.tag;
  var unit = tag.attributes['unit'];
  var version = tag.attributes['version'];
  return { unit: unit, version: version };
}

function extractMetadata(data) {
  var tag = data.tag;
  var text = data.text;


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

function vertexColors(data) {
  var tag = data.tag;


  var colorIds = ['pid', 'p1', 'p2', 'p3'].reduce(function (result, key) {
    if (key in tag.attributes) {
      var value = tag.attributes[key];
      result[key] = parseInt(value, 10);
    }
    return result;
  }, {});

  var output = (0, _assign2.default)({}, colorIds, vertexIndices(data));
  return output;
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

function extractColor(data) {
  var tag = data.tag;

  var color = tag.attributes['color'];
  if (color) {
    color = (0, _parseHelpers.hexToRgba)(color);
    color = (0, _parseHelpers.normalizeRgba)(color);
  }
  return color;
}

function extractColorGroup(data) {
  var tag = data.tag;


  var colorgroupData = ['id'].reduce(function (result, key) {
    if (key in tag.attributes) {
      var value = tag.attributes[key];
      result[key] = parseInt(value, 10);
    }
    return result;
  }, {});

  return colorgroupData;
}

function makeActions(rawData$) {
  var metadata$ = rawData$.filter(function (d) {
    return d.tag.name === 'metadata' && d.text;
  }).map(extractMetadata);

  var vCoords$ = rawData$.filter(function (d) {
    return d.tag.name === 'vertex' && d.start;
  }).map(vertexCoordinate);

  var triangle$ = rawData$.filter(function (d) {
    return d.tag.name === 'triangle' && d.start;
  }).share();

  var vIndices$ = triangle$.map(vertexIndices);

  var vColors$ = triangle$.filter(function (data) {
    return data.tag.attributes.hasOwnProperty('pid') && (data.tag.attributes.hasOwnProperty('p1') || data.tag.attributes.hasOwnProperty('p2') || data.tag.attributes.hasOwnProperty('p3'));
  }).map(vertexColors);

  var vNormals$ = triangle$.map(vertexIndices);

  var vCoords2$ = triangle$.map(vertexIndices);

  var startObject$ = rawData$.filter(function (d) {
    return d.tag.name === 'object' && d.start;
  });

  var finishObject$ = rawData$.filter(function (d) {
    return d.tag.name === 'object' && d.end;
  });

  var finishBuild$ = rawData$.filter(function (d) {
    return d.tag.name === 'build' && d.end;
  });

  var item$ = rawData$.filter(function (d) {
    return d.tag.name === 'item' && d.start;
  });

  // colors & materials
  var colorGroup$ = rawData$.filter(function (d) {
    return d.tag.name === 'm:colorgroup' && d.end;
  }).map(extractColorGroup);

  var color$ = rawData$.filter(function (d) {
    return d.tag.name === 'm:color' && d.start;
  }).map(extractColor);

  return {
    metadata$: metadata$,
    color$: color$,
    colorGroup$: colorGroup$,
    vCoords$: vCoords$,
    vCoords2$: vCoords2$,
    vIndices$: vIndices$,
    vNormals$: vNormals$,
    vColors$: vColors$,
    startObject$: startObject$,
    finishObject$: finishObject$,
    item$: item$,
    finishBuild$: finishBuild$
  };
}

function makeReducers() {
  var updateFns = {
    metadata: metadata,
    color: color,
    colorGroup: colorGroup,
    vCoords: vCoords,
    vCoords2: vCoords2,
    vIndices: vIndices,
    vNormals: vNormals,
    vColors: vColors,
    startObject: startObject,
    finishObject: finishObject,
    item: item,
    finishBuild: finishBuild
  };
  return updateFns;
}

/*
  const components$  = rawData$
  const component$  = rawData$*/

function metadata(state, input) {
  var metadata = (0, _assign2.default)({}, state.metadata, input);
  state.metadata = metadata;
  return state;
}

function vCoords(state, input) {
  state.currentObject.positions = state.currentObject.positions.concat(input);
  // state = assign(state, )
  // console.log("positions",input, state.currentObject.positions)
  return state;
}

function vCoords2(state, input) {
  var positions = state.currentObject.positions;
  var A = [positions[input[0] * 3], positions[input[0] * 3 + 1], positions[input[0] * 3 + 2]];
  var B = [positions[input[1] * 3], positions[input[1] * 3 + 1], positions[input[1] * 3 + 2]];
  var C = [positions[input[2] * 3], positions[input[2] * 3 + 1], positions[input[2] * 3 + 2]];

  // console.log("positions 2",positions, A, B, C)
  state.currentObject._attributes.positions = state.currentObject._attributes.positions.concat(A).concat(B).concat(C);
  return state;
}

function vIndices(state, input) {
  state.currentObject._attributes.indices = state.currentObject._attributes.indices.concat(input);
  return state;
}

function vNormals(state, input) {
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
      console.log('assign', target, startIndex, data, data[i]);
      target[startIndex + i] = data[i];
    }
  }

  function assignAllAtIndices(target, indices, data) {
    indices.forEach(function (cindex) {
      assignAtIndex(target, cindex * 3, data);
    });
  }

  state.currentObject._attributes.normals = state.currentObject._attributes.normals.concat(normal).concat(normal).concat(normal);

  return state;
}

function vColors(state, input) {
  // FIXME: deal with color GROUPS
  // console.log("vColors",input)
  var colorGroup = state.colors[input.pid];

  var p1 = 'p1' in input;
  var p2 = 'p2' in input;
  var p3 = 'p3' in input;

  var p1Decides = p1 && !p2 && !p3;
  var allP = p1 && p2 && p3;

  var colors = [];

  function assignAtIndex(target, startIndex, data) {
    for (var i = 0; i < 4; i++) {
      target[startIndex + i] = data[i];
    }
  }

  function assignAllAtIndices(target, indices, data) {
    indices.forEach(function (cindex, index) {
      assignAtIndex(target, cindex * 4, data[index]);
    });
  }
  var colorIndices = [input[0], input[1], input[2]];

  /* if(state.currentObject._attributes.colors.length ===0){
    state.currentObject._attributes.colors = new Array(7)
  }*/

  if (allP) {
    colors = colorGroup[input.p1].concat(colorGroup[input.p2], colorGroup[input.p3]);
    // const values = [colorGroup[input.p1], colorGroup[input.p2], colorGroup[input.p3]]
    // assignAllAtIndices(state.currentObject._attributes.colors, colorIndices, values)
  } else if (p1Decides) {
      var p1Color = colorGroup[input.p1];
      colors = p1Color.concat(p1Color, p1Color);

      // const values = [p1Color,p1Color,p1Color]
      // assignAllAtIndices(state.currentObject._attributes.colors, colorIndices, values)
    }

  if (colors.length > 0) {
    state.currentObject._attributes.colors = state.currentObject._attributes.colors.concat(colors);
  }

  return state;
}

function color(state, input) {
  // state.colors = state.colors.concat( input )
  state.currentColorGroup.push(input);
  return state;
}

function colorGroup(state, input) {
  state.colors[input.id] = state.currentColorGroup;
  state.currentColorGroup = [];
  return state;
}

function startObject(state, input) {
  var tag = input.tag;


  var object = ['id', 'name', 'type', 'pid'].reduce(function (result, key) {
    if (key in tag.attributes) {
      result[key] = tag.attributes[key];
    }
    return result;
  }, {});
  state.currentObject = (0, _assign2.default)({}, state.currentObject, object);
  return state;
}

function finishObject(state, input) {
  state.objects[state.currentObject.id] = (0, _parseHelpers.createModelBuffers)(state.currentObject);

  state.currentObject = {
    id: undefined,
    name: undefined,
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

function item(state, input) {
  var tag = input.tag;

  var item = ['objectid', 'transform', 'partnumber'].reduce(function (result, key) {
    if (key in tag.attributes) {
      if (key === 'transform') {
        result['transforms'] = tag.attributes[key].split(' ').map(function (t) {
          return parseFloat(t);
        });
      } else {
        result[key] = tag.attributes[key];
      }
    }
    return result;
  }, {});

  state.build = state.build.concat([item]);
  return state;
}

function finishBuild(state, input) {
  state._finished = true;
  return state;
}

function assemble(data) {
  var rawData$ = (0, _unpack2.default)(data).flatMap(_parseRawXml2.default).share();

  var defaultData = {
    metadata: {},
    objects: {},
    build: [],
    colors: {},
    currentObject: {
      id: undefined,
      positions: [],
      _attributes: {
        positions: [],
        normals: [],
        indices: [],
        colors: []
      }
    },
    currentColorGroup: []
  };

  var actions = makeActions(rawData$);
  var updateFns = makeReducers();
  var data$ = (0, _modelHelpers.makeModel)(defaultData, updateFns, actions);
  return data$;
}