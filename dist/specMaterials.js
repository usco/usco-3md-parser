'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.detectAndCreate_Materials = detectAndCreate_Materials;
exports.makeStateExtras = makeStateExtras;
exports.vertexColors = vertexColors;
exports.extractColorGroup = extractColorGroup;
exports.extractColor = extractColor;
exports.extractTexture2dgroup = extractTexture2dgroup;
exports.extractTexture2dCoord = extractTexture2dCoord;
exports.parseUv = parseUv;
exports.extractCompositeMaterials = extractCompositeMaterials;
exports.extractComposite = extractComposite;
exports.extractMultiProperties = extractMultiProperties;
exports.extractMulti = extractMulti;

var _parseHelpers = require('./parseHelpers');

var _specCore = require('./specCore');

var _specMaterialsCreate = require('./specMaterialsCreate');

function detectAndCreate_Materials(state, data) {
  if (data.tag.name === 'm:color' && data.start) {
    (0, _specMaterialsCreate.createColor)(state, extractColor(data));
  } else if (data.tag.name === 'm:colorgroup' && data.end) {
    (0, _specMaterialsCreate.createColorGroup)(state, extractColorGroup(data));
  } else if (data.tag.name === 'm:texture2dgroup' && data.end) {
    (0, _specMaterialsCreate.createTexture2dGroup)(state, extractTexture2dgroup(data));
  } else if (data.tag.name === 'm:compositematerials' && data.end) {
    (0, _specMaterialsCreate.createCompositeMaterials)(state, extractCompositeMaterials(data));
  } else if (data.tag.name === 'm:multiproperties' && data.end) {
    console.warn('multiproperties are not yet implemented');
  } else if (data.tag.name === 'triangle' && data.start) {
    if (data.tag.attributes.hasOwnProperty('pid') && (data.tag.attributes.hasOwnProperty('p1') || data.tag.attributes.hasOwnProperty('p2') || data.tag.attributes.hasOwnProperty('p3'))) {
      (0, _specMaterialsCreate.createVColors)(state, vertexColors(data));
    }
  } else if (data.tag.name === 'm:tex2coord' && data.end) {
    (0, _specMaterialsCreate.createUvs)(state, extractTexture2dCoord(data));
  } else if (data.tag.name === 'm:texture2d' && data.end) {
    console.warn('texture2d are not yet implemented');
  }
}

// any piece of state that needs to be added by this specific spec
function makeStateExtras() {
  return {
    currentColorGroup: { colors: [] },
    currentTexture2dGroup: { coords: [] },
    currentCompositeMaterials: []
  };
}

// All helpers after this point
function vertexColors(data) {
  var tag = data.tag;


  var colorIds = ['pid', 'p1', 'p2', 'p3'].reduce(function (result, key) {
    if (key in tag.attributes) {
      var value = tag.attributes[key];
      result[key] = parseInt(value, 10);
    }
    return result;
  }, {});

  var output = Object.assign({}, colorIds, (0, _specCore.vertexIndices)(data));
  return output;
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

function extractColor(data) {
  var tag = data.tag;

  var color = tag.attributes['color'];
  if (color) {
    color = (0, _parseHelpers.hexToRgba)(color);
    color = (0, _parseHelpers.normalizeRgba)(color);
  }
  return color;
}

// -----------Texturing
function extractTexture2dgroup(data) {
  var tag = data.tag;

  var textureGroupData = ['id', 'texid'].reduce(function (result, key) {
    if (key in tag.attributes) {
      var value = tag.attributes[key];
      result[key] = parseInt(value, 10);
    }
    return result;
  }, {});

  // console.log('textureGroupData', textureGroupData)
  return textureGroupData;
}
function extractTexture2dCoord(data) {
  var tag = data.tag;

  var uv = parseUv(tag);
  return uv;
}

function parseUv(node, prefix, defaultValue) {
  prefix = prefix || '';
  defaultValue = defaultValue || 0.0;

  var u = prefix + 'u' in node.attributes ? (0, _parseHelpers.parseText)(node.attributes[prefix + 'u'], 'float', defaultValue) : defaultValue;
  var v = prefix + 'v' in node.attributes ? (0, _parseHelpers.parseText)(node.attributes[prefix + 'v'], 'float', defaultValue) : defaultValue;
  return [u, v];
}

// ---------Materials
function extractCompositeMaterials(data) {
  var tag = data.tag;

  var compositeMaterials = ['id', 'matid'] // , 'matindices']
  .reduce(function (result, key) {
    if (key in tag.attributes) {
      var value = tag.attributes[key];
      result[key] = parseInt(value, 10);
    }
    return result;
  }, {});
  console.warn('compositeMaterials is not yet fully implemented');
  console.log('compositeMaterials', compositeMaterials);
  return compositeMaterials;
}

function extractComposite(data) {
  var tag = data.tag;

  console.warn('composite is not yet implemented');
  var composite = [];
  return composite;
}

function extractMultiProperties(data) {
  var tag = data.tag;

  console.warn('multiProperties is not yet implemented');
  var multiProperties = [];
  return multiProperties;
}

function extractMulti(data) {
  var tag = data.tag;

  console.warn('multi is not yet implemented');
  var multi = [];
  return multi;
}