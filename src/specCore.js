import { parseVector3, parseIndices } from './parseHelpers'
import { createModel, startObject, finishObject, createMetadata, createVIndices, createVNormals, createVCoords, createItem, createComponent } from './specCoreCreate'

export function detectAndCreate_Core (state, data) {
  if (data.tag.name === 'model') {
    createModel(state, extractModelData(data))
  } else if (data.tag.name === 'metadata' && data.text) {
    createMetadata(state, extractMetadata(data))
  } else if (data.tag.name === 'object' && data.start) {
    startObject(state, data)
  } else if (data.tag.name === 'object' && data.end) {
    finishObject(state, data)
  } else if (data.tag.name === 'vertex' && data.start) {
    state.currentObject.positions.push(...vertexCoordinate(data))
  } else if (data.tag.name === 'triangle' && data.start) {
    const vertexIndicesR = vertexIndices(data)
    createVIndices(state, vertexIndicesR)
    createVNormals(state, vertexIndicesR)
    createVCoords(state, vertexIndicesR)
  } else if (data.tag.name === 'item' && data.start) {
    createItem(state, data)
  } else if (data.tag.name === 'component' && data.end) {
    createComponent(state, data)
  } else if (data.tag.name === 'build' && data.end) {
    state._finished = true
  }
}

// any piece of state that needs to be added by this specific spec
export const stateExtras = {
  metadata: {},
  objects: {},
  build: [],
  currentObject: {
    id: undefined,
    name: undefined,
    positions: [],
    _attributes: {
      positions: [],
      normals: [],
      indices: [],
      colors: []
    }
  },
  resources: {}
}

// All helpers after this point
export function getScaleFromUnit (self, unit = 'millimeter') {
  const mapping = {
    'micron': 0.001,
    'millimeter': 1,
    'centimeter': 10,
    'meter': 1000,
    'inch': 25.4,
    'foot': 304.8
  }
  let scale = mapping[unit]
  if (scale === undefined) {
    console.warn(`Unrecognised unit ${unit} used. Assuming mm instead`)
    scale = 1
  }
  return [scale, scale, scale]
}

export function extractModelData (data) {
  let {tag} = data
  const unit = tag.attributes['unit']
  const scale = getScaleFromUnit(unit)
  const version = tag.attributes['version']
  let requiredExtensions = tag.attributes['requiredextensions']
  requiredExtensions = requiredExtensions ? requiredExtensions.split('') : []
  return {unit, version, requiredExtensions, scale}
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
