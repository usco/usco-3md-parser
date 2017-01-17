const sax = require('sax')

import { detectAndCreate_Core, makeStateExtras as coreState } from './specCore'
import { detectAndCreate_Materials, makeStateExtras as materialsState } from './specMaterials'

export default function parse ({callback, isRoot}) {
  let state = Object.assign({}, coreState(), materialsState())
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
    callback(state)
    state = undefined
  }

  xmlStream.on('opentag', onTagOpen)
  xmlStream.on('closetag', onTagClose)
  xmlStream.on('text', onTagText)
  xmlStream.on('end', onParseEnd)

  return xmlStream
}
