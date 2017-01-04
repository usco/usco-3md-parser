import {parseVector3, parseIndices, hexToRgba, normalizeRgba} from './parseHelpers'

export function threeMFInfo (data) {
  let tag = data.tag
  let unit = tag.attributes['unit']
  let version = tag.attributes['version']
  return {unit, version}
}

export function extractMetadata (data) {
  let {tag, text} = data

  let name = tag.attributes['name']
  let value = text
  let result = {}
  result[name] = value
  return result
}

export function vertexCoordinate (data) {
  let {tag} = data
  let vertexCoords = parseVector3(tag)
  return vertexCoords
}

export function vertexIndices (data) {
  let {tag} = data
  let vertexIndices = parseIndices(tag)
  return vertexIndices
}

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

export function component (data) {
  let {tag} = data
  return ['objectid', 'transform']
    .reduce(function (result, key) {
      if (key in tag.attributes) {
        result[key] = tag.attributes[key]
      }
      return result
    }, {})
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

  console.log('colorgroupData', colorgroupData)
  return colorgroupData
}
