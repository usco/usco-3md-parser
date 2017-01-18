import { matrixFromTransformString } from './parseHelpers'
// everything in this module is to help build up data from the raw data
const assign = Object.assign

export function createModel (state, input) {
  const {unit, version, requiredExtensions, scale} = input
  state.unit = unit
  state.version = version
  state.requiredExtensions = requiredExtensions
  state.transforms = {scale}
  return state
}

export function createModelBuffers (modelData) {
  // console.log("creating model buffers", modelData)//modelData, modelData._attributes)
  // other implementation
  const dataTypes = {'positions': Float32Array, 'indices': Uint32Array, 'normals': Float32Array, 'colors': Float32Array}

  let output = ['positions', 'normals', 'colors'] // , "indices"]
    .reduce(function (result, key) {
      if (key in modelData._attributes) {
        let data = modelData._attributes[key]
        let dataBuff = new dataTypes[key](data.length)
        // console.log('key',key, data, dataBuff)

        dataBuff.set(data)

        result[key] = dataBuff
      }
      return result
    }, {})

  return output
}

export function startObject (state, input) {
  let {tag} = input

  const object = ['id', 'name', 'type', 'pid']
    .reduce(function (result, key) {
      if (key in tag.attributes) {
        result[key] = tag.attributes[key]
      }
      return result
    }, {})

  //  metaType can be either 'object' or 'component'
  state.currentObject = assign({}, state.currentObject, object)
  return state
}

export function finishObject (state, input) {
  const object = state.currentObject
  
  state.objects[object.id] = Object.assign(
    {id: object.id, name: object.name, type: object.type},
    {geometry: createModelBuffers(object)},
    {components: object.components})

  state.currentObject = {
    id: undefined,
    name: undefined,
    components: [],
    positions: [],
    _attributes: {
      positions: [],
      normals: [],
      indices: [],
      colors: []
    }
  }
  return state
}

export function createMetadata (state, input) {
  let metadata = assign({}, state.metadata, input)
  state.metadata = metadata
  return state
}

export function createVCoords (state, input) {
  const positions = state.currentObject.positions
  const A = [positions[ input[0] * 3 ], positions[input[0] * 3 + 1], positions[input[0] * 3 + 2]]
  const B = [positions[ input[1] * 3 ], positions[input[1] * 3 + 1], positions[input[1] * 3 + 2]]
  const C = [positions[ input[2] * 3 ], positions[input[2] * 3 + 1], positions[input[2] * 3 + 2]]

  // console.log("createVCoords", positions, A, B, C)
  state.currentObject._attributes.positions.push(...A, ...B, ...C) // state.currentObject._attributes.positions.concat(A).concat(B).concat(C)
  return state
}

export function createVIndices (state, input) {
  state.currentObject._attributes.indices.push(...input) // = state.currentObject._attributes.indices.concat(input)
  return state
}

export function createVNormals (state, input) {
  // see specs : A triangle face normal (for triangle ABC, in that order) throughout this specification is defined as
  // a unit vector in the direction of the vector cross product (B - A) x (C - A).
  // (B - A) x (C - A).
  const normalIndices = [input[0], input[1], input[2]]
  const positions = state.currentObject.positions

  const A = [positions[ input[0] * 3 ], positions[input[0] * 3 + 1], positions[input[0] * 3 + 2]]
  const B = [positions[ input[1] * 3 ], positions[input[1] * 3 + 1], positions[input[1] * 3 + 2]]
  const C = [positions[ input[2] * 3 ], positions[input[2] * 3 + 1], positions[input[2] * 3 + 2]]

  // console.log("indices",normalIndices,input[0], positions, "A",A,"B",B,"C",C)

  function cross (a, b) {
    let ax = a[0], ay = a[1], az = a[2]
    let bx = b[0], by = b[1], bz = b[2]

    let x = ay * bz - az * by
    let y = az * bx - ax * bz
    let z = ax * by - ay * bx
    return [x, y, z]
  }
  function sub (a, b) {
    return [
      a[0] - b[0],
      a[1] - b[1],
      a[2] - b[2]
    ]
  }

  function length (v) {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])
  }

  function multiplyScalar (v, s) {
    return [ v[0] * s, v[1] * s, v[2] * s ]
  }
  function divideScalar (vector, scalar) {
    return multiplyScalar(vector, (1 / scalar))
  }

  function normalize (v) {
    return divideScalar(v, length(v))
  }

  const normal = normalize(cross(sub(B, A), sub(C, A)))

  function assignAtIndex (target, startIndex, data) {
    for (let i = 0;i < 3;i++) {
      console.log('assign', target, startIndex, data, data[i])
      target[startIndex + i] = data[i]
    }
  }

  function assignAllAtIndices (target, indices, data) {
    indices.forEach(function (cindex) {
      assignAtIndex(target, cindex * 3, data)
    })
  }

  state.currentObject._attributes.normals.push(...normal, ...normal, ...normal) // state.currentObject._attributes.normals.concat(normal).concat(normal).concat(normal)

  return state
}

export function createItem (state, input) {
  let {tag} = input
  const item = ['objectid', 'transform', 'partnumber', 'path']
    .reduce(function (result, key) {
      // console.log('result', result)
      if (key in tag.attributes) {
        if (key === 'transform') {
          result['transforms'] = matrixFromTransformString(tag.attributes[key]) // .split(' ').map(t => parseFloat(t))
        } else {
          result[key] = tag.attributes[key]
        }
      }
      return result
    }, {})
  state.build.push(item)

  if (item.path) {
    state.subResources.push(item.path)
  }
  return state
}

export function createComponent (state, input) {
  let {tag} = input
  const item = ['id', 'objectid', 'transform', 'path'] // FIXME: no clear seperation of specs, path is production spec
    .reduce(function (result, key) {
      // console.log('result', result)
      if (key in tag.attributes) {
        if (key === 'transform') {
          result['transforms'] = matrixFromTransformString(tag.attributes[key])
        } else {
          result[key] = tag.attributes[key]
        }
      }
      return result
    }, {})

  // state.objects[state.currentObject.id]= item
  state.currentObject.components.push(item)
// console.log('createComponent', item)
}
