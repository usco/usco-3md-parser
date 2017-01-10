import { hexToRgba, normalizeRgba, parseText } from './parseHelpers'
import { vertexIndices } from './specCore'
import { createColor, createColorGroup, createTexture2dGroup, createCompositeMaterials, createVColors, createUvs } from './specMaterialsCreate'

export function detectAndCreate_Materials (state, data) {
  if (data.tag.name === 'm:color' && data.start) {
    createColor(state, extractColor(data))
  } else if (data.tag.name === 'm:colorgroup' && data.end) {
    createColorGroup(state, extractColorGroup(data))
  } else if (data.tag.name === 'm:texture2dgroup' && data.end) {
    createTexture2dGroup(state, extractTexture2dgroup(data))
  } else if (data.tag.name === 'm:compositematerials' && data.end) {
    createCompositeMaterials(state, extractCompositeMaterials(data))
  } else if (data.tag.name === 'm:multiproperties' && data.end) {
    console.warn('multiproperties are not yet implemented')
  } else if (data.tag.name === 'triangle' && data.start) {
    if (data.tag.attributes.hasOwnProperty('pid') && (data.tag.attributes.hasOwnProperty('p1') || data.tag.attributes.hasOwnProperty('p2') || data.tag.attributes.hasOwnProperty('p3'))) {
      createVColors(state, vertexColors(data))
    }
  } else if (data.tag.name === 'm:tex2coord' && data.end) {
    createUvs(state, extractTexture2dCoord(data))
  } else if (data.tag.name === 'm:texture2d' && data.end) {
    console.warn('texture2d are not yet implemented')
  }
}

// any piece of state that needs to be added by this specific spec
export const stateExtras = {
  currentColorGroup: {colors: []},
  currentTexture2dGroup: {coords: []},
  currentCompositeMaterials: []
}

// All helpers after this point
export function vertexColors (data) {
  let {tag} = data

  let colorIds = ['pid', 'p1', 'p2', 'p3']
    .reduce(function (result, key) {
      if (key in tag.attributes) {
        let value = tag.attributes[key]
        result[key] = parseInt(value, 10)
      }
      return result
    }, {})

  const output = Object.assign({}, colorIds, vertexIndices(data))
  return output
}

export function extractColorGroup (data) {
  let {tag} = data
  let colorgroupData = ['id']
    .reduce(function (result, key) {
      if (key in tag.attributes) {
        let value = tag.attributes[key]
        result[key] = parseInt(value, 10)
      }
      return result
    }, {})

  return colorgroupData
}

export function extractColor (data) {
  let {tag} = data
  let color = tag.attributes['color']
  if (color) {
    color = hexToRgba(color)
    color = normalizeRgba(color)
  }
  return color
}

// -----------Texturing
export function extractTexture2dgroup (data) {
  let {tag} = data
  let textureGroupData = ['id', 'texid']
    .reduce(function (result, key) {
      if (key in tag.attributes) {
        let value = tag.attributes[key]
        result[key] = parseInt(value, 10)
      }
      return result
    }, {})

  // console.log('textureGroupData', textureGroupData)
  return textureGroupData
}
export function extractTexture2dCoord (data) {
  let {tag} = data
  const uv = parseUv(tag)
  return uv
}

export function parseUv (node, prefix, defaultValue) {
  prefix = prefix || ''
  defaultValue = defaultValue || 0.0

  const u = (prefix + 'u' in node.attributes) ? parseText(node.attributes[prefix + 'u'], 'float', defaultValue) : defaultValue
  const v = (prefix + 'v' in node.attributes) ? parseText(node.attributes[prefix + 'v'], 'float', defaultValue) : defaultValue
  return [u, v]
}

// ---------Materials
export function extractCompositeMaterials (data) {
  let {tag} = data
  let compositeMaterials = ['id', 'matid'] // , 'matindices']
    .reduce(function (result, key) {
      if (key in tag.attributes) {
        let value = tag.attributes[key]
        result[key] = parseInt(value, 10)
      }
      return result
    }, {})
  console.warn('compositeMaterials is not yet fully implemented')
  console.log('compositeMaterials', compositeMaterials)
  return compositeMaterials
}

export function extractComposite (data) {
  let {tag} = data
  console.warn('composite is not yet implemented')
  let composite = []
  console.log('composite', composite)
  return composite
}

export function extractMultiProperties (data) {
  let {tag} = data
  console.warn('multiProperties is not yet implemented')
  let multiProperties = []
  console.log('multiProperties', multiProperties)
  return multiProperties
}

export function extractMulti (data) {
  let {tag} = data
  console.warn('multi is not yet implemented')
  let multi = []
  console.log('multi', multi)
  return multi
}
