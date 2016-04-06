'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseText = parseText;
exports.parseColor = parseColor;
exports.hexToRgba = hexToRgba;
exports.normalizeRgba = normalizeRgba;
exports.parseVector3 = parseVector3;
exports.parseIndices = parseIndices;
exports.parseMapCoords = parseMapCoords;
exports.createModelBuffers = createModelBuffers;
function parseText(value, toType, defaultValue) {
  defaultValue = defaultValue || null;

  if (value !== null && value !== undefined) {
    switch (toType) {
      case 'float':
        value = parseFloat(value);
        break;
      case 'int':
        value = parseInt(value);
        break;
      // default:
    }
  } else if (defaultValue !== null) {
      value = defaultValue;
    }
  return value;
}

/*export function parseAttribute( value , toType, defaultValue){
  attributes
}*/

function parseColor(node, defaultValue) {
  var color = defaultValue || null; // let color = volumeColor !== null ? volumeColor : new THREE.Color("#ffffff")

  var r = parseText(node.r.value, 'float', 1.0);
  var g = parseText(node.g.value, 'float', 1.0);
  var b = parseText(node.b.value, 'float', 1.0);
  var a = 'a' in node ? parseText(node.a.value, 'float', 1.0) : 1.0;
  color = [r, g, b, a];
  return color;
}

function hexToRgba(hex) {
  hex = hex.replace('#', '');
  var r = parseInt(hex.substring(0, 2), 16);
  var g = parseInt(hex.substring(2, 4), 16);
  var b = parseInt(hex.substring(4, 6), 16);
  var a = parseInt(hex.substring(6, 8), 16);
  return [r, g, b, a];
}

// normalize 0-255 values to 0-1
function normalizeRgba(rgba) {
  return rgba.map(function (v) {
    return +(v / 255).toFixed(2);
  });
}

function parseVector3(node, prefix, defaultValue) {
  var coords = null;
  prefix = prefix || '';
  defaultValue = defaultValue || 0.0;

  var x = prefix + 'x' in node.attributes ? parseText(node.attributes[prefix + 'x'], 'float', defaultValue) : defaultValue;
  var y = prefix + 'y' in node.attributes ? parseText(node.attributes[prefix + 'y'], 'float', defaultValue) : defaultValue;
  var z = prefix + 'z' in node.attributes ? parseText(node.attributes[prefix + 'z'], 'float', defaultValue) : defaultValue;

  coords = [x, y, z];
  return coords;
}

function parseIndices(node) {
  var prefix = '';
  var defaultValue = 0;
  var v1 = parseText(node.attributes[prefix + 'v1'], 'int', defaultValue);
  var v2 = parseText(node.attributes[prefix + 'v2'], 'int', defaultValue);
  var v3 = parseText(node.attributes[prefix + 'v3'], 'int', defaultValue);

  return [v1, v2, v3];
}

function parseMapCoords(node, prefix, defaultValue) {
  // console.log("parsing map coords", node, ("btexid" in node) , node.btexid)
  // get vertex UVs (optional)
  // rtexid, gtexid, btexid

  var rtexid = 'rtexid' in node ? parseText(node['rtexid'], 'int', null) : null;
  var gtexid = 'gtexid' in node ? parseText(node['gtexid'], 'int', defaultValue) : null;
  var btexid = 'btexid' in node ? parseText(node['btexid'], 'int', defaultValue) : null;

  var u1 = 'u1' in node ? parseText(node['u1'].value, 'float', defaultValue) : null;
  var u2 = 'u2' in node ? parseText(node['u2'].value, 'float', defaultValue) : null;
  var u3 = 'u3' in node ? parseText(node['u3'].value, 'float', defaultValue) : null;

  var v1 = 'v1' in node ? parseText(node['v1'].value, 'float', defaultValue) : null;
  var v2 = 'v2' in node ? parseText(node['v2'].value, 'float', defaultValue) : null;
  var v3 = 'v3' in node ? parseText(node['v3'].value, 'float', defaultValue) : null;

  // console.log("textures ids", rtexid,gtexid,btexid,"coords", u1,u2,u3,"/", v1,v2,v3)
  // face.materialIndex  = rtexid
  // face.materialIndex  = 0

  var uv1 = u1 !== null && v1 != null ? [u1, v1] : null;
  var uv2 = u2 !== null && v2 != null ? [u2, v2] : null;
  var uv3 = u3 !== null && v3 != null ? [u3, v3] : null;

  var mappingData = { matId: 0, uvs: [uv1, uv2, uv3] };
  // currentGeometry.faceVertexUvs[ 0 ].push( [uv1,uv2,uv3])
  return mappingData;
}

function createModelBuffers(modelData) {
  // console.log("creating model buffers")//modelData, modelData._attributes)
  // other implementation
  var dataTypes = { 'positions': Float32Array, 'indices': Uint32Array, 'normals': Float32Array, 'colors': Float32Array };

  var output = ['positions', 'normals', 'colors'] // , "indices"]
  .reduce(function (result, key) {
    if (key in modelData._attributes) {
      var data = modelData._attributes[key];

      var dataBuff = new dataTypes[key](data.length);
      dataBuff.set(data);

      result[key] = dataBuff;
    }
    return result;
  }, {});

  output.id = modelData.id;
  output.name = modelData.name;

  return output;
}