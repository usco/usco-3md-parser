'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createColorGroup = createColorGroup;
exports.createColor = createColor;
exports.createTexture2dGroup = createTexture2dGroup;
exports.createUvs = createUvs;
exports.createCompositeMaterials = createCompositeMaterials;
exports.createVColors = createVColors;

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function createColorGroup(state, input) {
  // console.log('setting colorGroup', input, state.colors)
  state.currentColorGroup.type = 'colorGroup';

  state.resources[input.id] = state.currentColorGroup;
  state.currentColorGroup = { colors: [] };
  return state;
}

function createColor(state, input) {
  // console.log('setting color in colorGroup', input, state.currentColorGroup)
  // state.colors = state.colors.concat( input )
  state.currentColorGroup.colors.push(input); // input[0], input[1], input[2], input[3])
  return state;
}

function createTexture2dGroup(state, input) {
  //console.log('creating texture2dgroup', input)
  state.currentTexture2dGroup.texid = input.texid;
  state.currentTexture2dGroup.type = 'tex2dGroup';

  state.resources[input.id] = state.currentTexture2dGroup;
  state.currentTexture2dGroup = { coords: [] };
  return state;
}

function createUvs(state, input) {
  state.currentTexture2dGroup.coords.push(input);
}

function createCompositeMaterials(state, input) {
  //console.log('creating compositeMaterials', input)
  state.currentCompositeMaterials.matid = input.matid;
  // state.currentCompositeMaterials.matindices = input.matindices
  state.currentCompositeMaterials.type = 'compositeMaterial';

  state.resources[input.id] = state.currentCompositeMaterials;

  state.currentCompositeMaterials = [];
  return state;
}

function createVColors(state, input) {
  //console.log("createVColors", input, state.resources[input.pid])
  var colorGroup = state.resources[input.pid];
  var colors = [];
  // if the specified group is NOT a color group or does not exist, bail out
  if (!colorGroup || colorGroup.type !== 'colorGroup') {
    return;
  }
  var p1 = 'p1' in input;
  var p2 = 'p2' in input;
  var p3 = 'p3' in input;

  var p1Decides = p1 && !p2 && !p3;
  var allP = p1 && p2 && p3;

  if (allP) {
    var p1Colors = colorGroup.colors[input.p1];
    var p2Colors = colorGroup.colors[input.p2];
    var p3Colors = colorGroup.colors[input.p3];
    colors = p1Colors.concat(p2Colors, p3Colors);
  } else if (p1Decides) {
    var _p1Colors = colorGroup.colors[input.p1];
    colors = _p1Colors.concat(_p1Colors, _p1Colors);
  }

  if (colors.length > 0) {
    var _state$currentObject$;

    (_state$currentObject$ = state.currentObject._attributes.colors).push.apply(_state$currentObject$, _toConsumableArray(colors)); // = state.currentObject._attributes.colors.concat(colors)
  }

  return state;
}