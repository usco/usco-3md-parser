let JSZip = require('jszip')
import Rx from 'rx'
let from = Rx.Observable.from

function toBuffer (ab) {
  var buffer = new Buffer(ab.byteLength)
  var view = new Uint8Array(ab)
  for (var i = 0; i < buffer.length; ++i) {
    buffer[i] = view[i]
  }
  return buffer
}

// not really streaming...yet
function streamZipData (arrayBuffer, obs) {
  if (typeof Blob !== 'undefined') {
    // browser land
    let blob = new Blob([arrayBuffer])
    let reader = new FileReader()

    reader.onload = function (e) {
      let txt = e.target.result
      obs.onNext(txt)
    }
    reader.readAsText(blob)
  } else {
    // node land
    // let fs = require('fs')
    let buffer = toBuffer(arrayBuffer)
    obs.onNext(ensureString(buffer))
  }
}

// TODO this needs to stream the data
export default function unpack (data) {
  let zip = new JSZip(data)
  // console.log("entries", zip.files)
  let entries$ = from(Object.keys(zip.files).map(key => zip.files[key]))

  return entries$
    .filter(entry => entry !== undefined)
    .filter(entry => entry._data !== null)
    .filter(entry => entry.dir === false)

    .filter(entry => entry.name.startsWith('3D/'))

    .flatMap(
      function (entry) {
        let result = new Rx.ReplaySubject(1)
        let ab = entry.asArrayBuffer()
        streamZipData(ab, result)
        return result
      }
  )
    .catch(function (error) {
      // console.log("error",error)
      let formated = ensureString(data) // why do we use this ?
      return formated
    })
}

function ensureString (buf) {
  if (typeof buf !== 'string') {
    let array_buffer = new Uint8Array(buf)
    let str = ''
    for (let i = 0; i < buf.byteLength; i++) {
      str += String.fromCharCode(array_buffer[i]) // implicitly assumes little-endian
    }
    return str
  } else {
    return buf
  }
}
