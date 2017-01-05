import {parseVector3, parseIndices} from './parseHelpers'
import { startObject, finishObject, metadata,
  vIndices, vNormals, vCoords2, vColors, vCoords, color, colorGroup, item
} from './specCoreCreate'

export function detectAndCreate_Core (state, data) {
  if (data.tag.name === 'metadata' && data.text) {
    metadata(state, extractMetadata(data))
  } else if (data.tag.name === 'object' && data.start) {
    startObject(state, data)
  } else if (data.tag.name === 'object' && data.end) {
    finishObject(state, data)
  } else if (data.tag.name === 'vertex' && data.start) {
    let input = vertexCoordinate(data)
    state.currentObject.positions.push(input)
  } else if (data.tag.name === 'triangle' && data.start) {
    const vertexIndicesR = vertexIndices(data)
    vIndices(state, vertexIndicesR)
    vNormals(state, vertexIndicesR)
    vCoords2(state, vertexIndicesR)
  } else if (data.tag.name === 'item' && data.start) {
    item(state, data)
  } else if (data.tag.name === 'build' && data.end) {
    state._finished = true
  }
}

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
