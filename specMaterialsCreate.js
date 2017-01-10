export function createColorGroup (state, input) {
  // console.log('setting colorGroup', input, state.colors)
  state.currentColorGroup.type = 'colorGroup'

  state.resources[input.id] = state.currentColorGroup
  state.currentColorGroup = {colors: []}
  return state
}

export function createColor (state, input) {
  // console.log('setting color in colorGroup', input, state.currentColorGroup)
  // state.colors = state.colors.concat( input )
  state.currentColorGroup.colors.push(input) // input[0], input[1], input[2], input[3])
  return state
}

export function createTexture2dGroup (state, input) {
  //console.log('creating texture2dgroup', input)
  state.currentTexture2dGroup.texid = input.texid
  state.currentTexture2dGroup.type = 'tex2dGroup'

  state.resources[input.id] = state.currentTexture2dGroup
  state.currentTexture2dGroup = {coords: []}
  return state
}

export function createUvs (state, input) {
  state.currentTexture2dGroup.coords.push(input)
}

export function createCompositeMaterials (state, input) {
  //console.log('creating compositeMaterials', input)
  state.currentCompositeMaterials.matid = input.matid
  // state.currentCompositeMaterials.matindices = input.matindices
  state.currentCompositeMaterials.type = 'compositeMaterial'

  state.resources[input.id] = state.currentCompositeMaterials

  state.currentCompositeMaterials = []
  return state
}

export function createVColors (state, input) {
  //console.log("createVColors", input, state.resources[input.pid])
  let colorGroup = state.resources[input.pid]
  let colors = []
  // if the specified group is NOT a color group or does not exist, bail out
  if (!colorGroup || colorGroup.type !== 'colorGroup') {
    return
  }
  const p1 = 'p1' in input
  const p2 = 'p2' in input
  const p3 = 'p3' in input

  const p1Decides = p1 && ! p2 && ! p3
  const allP = p1 && p2 && p3

  if (allP) {
    const p1Colors = colorGroup.colors[input.p1]
    const p2Colors = colorGroup.colors[input.p2]
    const p3Colors = colorGroup.colors[input.p3]
    colors = p1Colors.concat(p2Colors, p3Colors)
  }else if (p1Decides) {
    const p1Colors = colorGroup.colors[input.p1]
    colors = p1Colors.concat(p1Colors, p1Colors)
  }

  if (colors.length > 0) {
    state.currentObject._attributes.colors.push(...colors) // = state.currentObject._attributes.colors.concat(colors)
  }

  return state
}
