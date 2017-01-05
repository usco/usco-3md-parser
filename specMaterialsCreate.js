export function createColorGroup (state, input) {
  // console.log('setting colorGroup', input, state.colors)
  state.colors[input.id] = state.currentColorGroup
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
  console.log('creating texture2dgroup', input)
  state.currentTexture2dGroup.texid = input.texid
  state.colors[input.id] = state.currentTexture2dGroup
  state.resources[input.id] = state.currentTexture2dGroup
  state.currentTexture2dGroup = {coords: []}
  return state
}

export function createUvs (state, input) {
  state.currentTexture2dGroup.coords.push(input)
}

export function createCompositeMaterials (state, input) {
  console.log('creating compositeMaterials', input)
  state.colors[input.id] = state.currentCompositeMaterials
  state.resources[input.id] = state.currentCompositeMaterials

  state.currentCompositeMaterials = []
  return state
}



export function createVColors (state, input) {
  // FIXME: deal with color GROUPS
  // console.log("vColors",input)
  // console.log(state.colors, input.pid)
  let colorGroup = state.colors[input.pid ] // FIXME, verify the -1

  const p1 = 'p1' in input
  const p2 = 'p2' in input
  const p3 = 'p3' in input

  const p1Decides = p1 && ! p2 && ! p3
  const allP = p1 && p2 && p3

  let colors = []

  function assignAtIndex (target, startIndex, data) {
    for (let i = 0; i < 4; i++) {
      target[startIndex + i] = data[i]
    }
  }

  function assignAllAtIndices (target, indices, data) {
    indices.forEach(function (cindex, index) {
      assignAtIndex(target, cindex * 4, data[index])
    })
  }
  // const colorIndices = [input[0], input[1], input[2]]

  /* if(state.currentObject._attributes.colors.length ===0){
    state.currentObject._attributes.colors = new Array(7)
  }*/

  if (allP) {
    // console.log(input, colorGroup)
    colors = colorGroup[input.p1].concat(colorGroup[input.p2], colorGroup[input.p3])
  // FIXME : really old one, remove ?
  // const values = [colorGroup[input.p1], colorGroup[input.p2], colorGroup[input.p3]]
  // assignAllAtIndices(state.currentObject._attributes.colors, colorIndices, values)
  }else if (p1Decides) {
    const p1Color = colorGroup[input.p1]
    colors = p1Color.concat(p1Color, p1Color)

  // const values = [p1Color,p1Color,p1Color]
  // assignAllAtIndices(state.currentObject._attributes.colors, colorIndices, values)
  }

  if (colors.length > 0) {
    state.currentObject._attributes.colors.push(colors) // = state.currentObject._attributes.colors.concat(colors)
  }

  return state
}
