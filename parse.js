const concat = require('concat-stream')
const JSZip = require('jszip')
const sax = require('sax')

import { detectAndCreate_Core } from './specCore'
import { detectAndCreate_Materials } from './specMaterials'
/*  const concat = require('concat-stream')
  // const unzipper = require('unzipper')
  // const unzip = require('unzip')
  const JSZip = require('jszip')
  const sax = require('sax')
  //const xmlParser = require('xml-streamer') // fails to load
  const xmlSplit = require('xmlsplit') //does not work/unclear api

  const sourceStream = fileReaderStream(files[0], {chunkSize: 64000})*/

export default function(callback) {
  let state = {
    metadata: {},
    objects: {},
    build: [],
    colors: {},
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

    currentColorGroup: {colors: []},
    currentTexture2dGroup: {coords: []},

    currentCompositeMaterials: [],
    resources: {
    }
  }
  const xmlStream = sax.createStream(true, {trim: true})

  function processData (data) {
    // deal with core data
    detectAndCreate_Core(state, data)
    // deal with materials and colors
    detectAndCreate_Materials(state, data)
  }

  function onTagOpen (tag) {
    processData({tag, start: true})
  }

  function onTagClose (tag) {
    if (!tag.name) { tag = {name: tag} }
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
