const concat = require('concat-stream')
const JSZip = require('jszip')
const sax = require('sax')

/*  const concat = require('concat-stream')
  // const unzipper = require('unzipper')
  // const unzip = require('unzip')
  const JSZip = require('jszip')
  const sax = require('sax')
  //const xmlParser = require('xml-streamer') // fails to load
  const xmlSplit = require('xmlsplit') //does not work/unclear api

  const sourceStream = fileReaderStream(files[0], {chunkSize: 64000})*/

export default function(callback) {
  const xmlStream = sax.createStream(true, {trim: true})
  function onTagOpen (tag) {
    // console.log("onTagOpen",tag)
  }

  function onTagClose (tag) {
    console.log('onTagClose', tag)
  }
  function onTagText (text) {
    console.log('text', text) // , this._parser.tag)
  }

  function onParseEnd () {
    callback({geometries: []})
  }
  // saxStream.on('opentag', onTagOpen)
  // saxStream.on('closetag', onTagClose)
  // saxStream.on('text', onTagText)
  xmlStream.on('end', onParseEnd)

  return concat(function (data) {
    new JSZip().loadAsync(data).then(function (zip) {
      if (zip.files && zip.files['3D'] !== null) {
        zip.file('3D/3dmodel.model').nodeStream()
          .pipe(xmlStream)
      }
    })
    return data
  })
}
