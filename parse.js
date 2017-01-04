const concat = require('concat-stream')
const JSZip = require('jszip')
const sax = require('sax')

import { vertexCoordinate, extractMetadata, extractColorGroup, extractColor, vertexIndices, vertexColors } from './helpers'
import { createModelBuffers } from './parseHelpers'
/*  const concat = require('concat-stream')
  // const unzipper = require('unzipper')
  // const unzip = require('unzip')
  const JSZip = require('jszip')
  const sax = require('sax')
  //const xmlParser = require('xml-streamer') // fails to load
  const xmlSplit = require('xmlsplit') //does not work/unclear api

  const sourceStream = fileReaderStream(files[0], {chunkSize: 64000})*/

const assign = Object.assign

export default function(callback) {
  let defaultData = {
    metadata: {},
    objects: {},
    build: [],
    colors: {},
    currentObject: {
      id: undefined,
      positions: [],
      _attributes: {
        positions: [],
        normals: [],
        indices: [],
        colors: []
      }
    },
    currentColorGroup: []
  }
  const xmlStream = sax.createStream(true, {trim: true})

  let state = defaultData

  function startObject (state, input) {
    let {tag} = input

    const object = ['id', 'name', 'type', 'pid']
      .reduce(function (result, key) {
        if (key in tag.attributes) {
          result[key] = tag.attributes[key]
        }
        return result
      }, {})
    state.currentObject = assign({}, state.currentObject, object)
    return state
  }

  function finishObject (state, input) {
    state.objects[state.currentObject.id] = createModelBuffers(state.currentObject)

    state.currentObject = {
      id: undefined,
      name: undefined,
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

  function metadata (state, input) {
    let metadata = assign({}, state.metadata, input)
    state.metadata = metadata
    return state
  }

  function vCoords2 (state, input) {
    const positions = state.currentObject.positions
    const A = [positions[ input[0] * 3 ], positions[input[0] * 3 + 1], positions[input[0] * 3 + 2]]
    const B = [positions[ input[1] * 3 ], positions[input[1] * 3 + 1], positions[input[1] * 3 + 2]]
    const C = [positions[ input[2] * 3 ], positions[input[2] * 3 + 1], positions[input[2] * 3 + 2]]

    // console.log("positions 2",positions, A, B, C)
    state.currentObject._attributes.positions.push(A, B, C) // state.currentObject._attributes.positions.concat(A).concat(B).concat(C)
    return state
  }

  function vIndices (state, input) {
    state.currentObject._attributes.indices.push(input) // = state.currentObject._attributes.indices.concat(input)
    return state
  }

  function vNormals (state, input) {
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

    state.currentObject._attributes.normals.push(normal, normal, normal) // state.currentObject._attributes.normals.concat(normal).concat(normal).concat(normal)

    return state
  }

  function item (state, input) {
    let {tag} = input
    const item = ['objectid', 'transform', 'partnumber']
      .reduce(function (result, key) {
        // console.log('result', result)
        if (key in tag.attributes) {
          if (key === 'transform') {
            result['transforms'] = tag.attributes[key].split(' ').map(t => parseFloat(t))
          } else {
            result[key] = tag.attributes[key]
          }
        }
        return result
      }, {})

    state.build.push[item]
    return state
  }

  function vColors (state, input) {
    // FIXME: deal with color GROUPS
    // console.log("vColors",input)
    //console.log(state.colors, input.pid)
    let colorGroup = state.colors[input.pid ]//FIXME, verify the -1

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
      //console.log(input, colorGroup)
      colors = colorGroup[input.p1].concat(colorGroup[input.p2], colorGroup[input.p3])
      //FIXME : really old one, remove ?
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

  function color (state, input) {
    //console.log('setting color in colorGroup', input, state.currentColorGroup)
    // state.colors = state.colors.concat( input )
    state.currentColorGroup.push(input)//input[0], input[1], input[2], input[3])
    return state
  }

  function colorGroup (state, input) {
    //console.log('setting colorGroup', input, state.colors)
    state.colors[input.id] = state.currentColorGroup
    state.currentColorGroup = []
    return state
  }

  // /////

  function processData (d) {
    if (d.tag.name === 'metadata' && d.text) {
      metadata(state, extractMetadata(d))
    } else if (d.tag.name === 'object' && d.start) {
      startObject(state, d)
    } else if (d.tag.name === 'object' && d.end) {
      finishObject(state, d)
    } else if (d.tag.name === 'vertex' && d.start) {
      let input = vertexCoordinate(d)
      state.currentObject.positions.push(input)
    } else if (d.tag.name === 'triangle' && d.start) {
      const vertexIndicesR = vertexIndices(d)
      vIndices(state, vertexIndicesR)
      vNormals(state, vertexIndicesR)
      vCoords2(state, vertexIndicesR)
      if (d.tag.attributes.hasOwnProperty('pid') && (d.tag.attributes.hasOwnProperty('p1') || d.tag.attributes.hasOwnProperty('p2') || d.tag.attributes.hasOwnProperty('p3'))) {
        vColors(state, vertexColors(d))
      }
    } else if (d.tag.name === 'm:color' && d.start) {
      color(state, extractColor(d))
    } else if (d.tag.name === 'm:colorgroup' && d.end) {
      colorGroup(state, extractColorGroup(d))
    } else if (d.tag.name === 'item' && d.start) {
      item(state, d)
    } else if (d.tag.name === 'build' && d.end) {
      state._finished = true
    }
  }

  function onTagOpen (tag) {
    processData({tag, start: true})
  }

  function onTagClose (tag) {
    if (!tag.name) {
      tag = {name: tag}
    }
    processData({tag: this._parser.tag, end: true})
  }
  function onTagText (text) {
    processData({tag: this._parser.tag, text})
  }

  function onParseEnd () {
    console.log('done', state)
    callback({geometries: []})
  }

  xmlStream.on('opentag', onTagOpen)
  xmlStream.on('closetag', onTagClose)
  xmlStream.on('text', onTagText)
  xmlStream.on('end', onParseEnd)

  return concat(function (data) {
    new JSZip().loadAsync(data).then(function (zip) {
      if (zip.files && zip.files['3D'] !== null) {
        zip.file('3D/3dmodel.model').nodeStream().pipe(xmlStream)
      }
    })
    return data
  })
}
