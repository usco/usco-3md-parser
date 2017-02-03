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
exports.matrixFromTransformString = matrixFromTransformString;

var _glMat = require('gl-mat4');

var _glMat2 = _interopRequireDefault(_glMat);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function parseText(value, toType, defaultValue) {
  defaultValue = defaultValue || null;

  if (value !== null && value !== undefined) {
    switch (toType) {
      case 'float':
        value = parseFloat(value);
        break;
      case 'int':
        value = parseInt(value, 10);
        break;
    }
  } else if (defaultValue !== null) {
    value = defaultValue;
  }
  return value;
}

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
  var a = hex.length > 6 ? parseInt(hex.substring(6, 8), 16) : 255;
  return [r, g, b, a];
}

// normalize 0-255 values to 0-1
function normalizeRgba(rgba) {
  return rgba.map(function (v) {
    return +(v / 255).toFixed(2);
  });
}

function parseVector3(node, prefix, defaultValue) {
  prefix = prefix || '';
  defaultValue = defaultValue || 0.0;

  var x = prefix + 'x' in node.attributes ? parseText(node.attributes[prefix + 'x'], 'float', defaultValue) : defaultValue;
  var y = prefix + 'y' in node.attributes ? parseText(node.attributes[prefix + 'y'], 'float', defaultValue) : defaultValue;
  var z = prefix + 'z' in node.attributes ? parseText(node.attributes[prefix + 'z'], 'float', defaultValue) : defaultValue;
  return [x, y, z];
}

function parseIndices(node) {
  var prefix = '';
  var defaultValue = 0;
  var v1 = parseText(node.attributes[prefix + 'v1'], 'int', defaultValue);
  var v2 = parseText(node.attributes[prefix + 'v2'], 'int', defaultValue);
  var v3 = parseText(node.attributes[prefix + 'v3'], 'int', defaultValue);

  if (v1 === v2 || v1 === v3 || v2 === v3) {
    throw new Error('the indices v1,v2,v3 should be different.');
  }

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

function matrixFromTransformString(transform) {
  transform = transform.split(' ').map(parseFloat);
  // console.log('matrixFromTransformString',transform)

  // Transformation is saved as:
  // M00 M01 M02 0.0
  // M10 M11 M12 0.0
  // M20 M21 M22 0.0
  // M30 M31 M32 1.0

  // reusing some of the Cura 3mf parser code
  var mat = _glMat2.default.create();
  // We are switching the row & cols as that is how everyone else uses matrices!
  // set Rotation & Scale
  /*mat[0] = transform[0]
  mat[1] = transform[3]
  mat[2] = transform[6]
  mat[3] = transform[9]
   mat[4] = transform[1]
  mat[5] = transform[4]
  mat[6] = transform[7]
  mat[7] = transform[10]
   mat[8] = transform[2]
  mat[9] = transform[5]
  mat[10] = transform[8]
  mat[11] = transform[11]*/
  /*mat[0] = transform[0]
  mat[1] = transform[3]
  mat[2] = transform[6]
   mat[4] = transform[3]
  mat[5] = transform[4]
  mat[6] = transform[5]
   mat[8] = transform[6]
  mat[9] = transform[7]
  mat[10] = transform[8]*/

  /*[
    1,0,0,0,
    0,1,0,0,
    0,0,1,0,
    0,0,0,1
  ]*/
  // IMPORTANT !! translate first otherwise translation is impacted by negative scale etc
  _glMat2.default.translate(mat, mat, [transform[9], transform[10], transform[11]]);

  mat[0] = transform[0];
  mat[4] = transform[1];
  mat[8] = transform[2];

  mat[1] = transform[3];
  mat[5] = transform[4];
  mat[9] = transform[5];

  mat[2] = transform[6];
  mat[6] = transform[7];
  mat[10] = transform[8];

  //mat[3] = 1//transform[9]
  //mat[7] = 1//transform[10]
  //mat[11] = 1//transform[11]
  //console.log('transform', transform[9], transform[10], transform[11])
  return mat;
}