import detectEnv from 'composite-detect'
import workerSpawner from './workerSpawner'
// import makeStreamParser from './parseStream'
import makeStreamParser from './makeStreamParser'

/**
 * @author kaosat-dev / https://github.com/kaosat-dev
 *
 * Description: A streaming (node.js streams) parser for 3MF files
 * Optimised both for speed and low memory consumption
 *
 *
 * Limitations:
 *
**/

function wrapper () {
  const Duplex = require('stream').Duplex
  class Outer extends Duplex {
    constructor () {
      super({readableObjectMode: true})
      this.streamParser = makeStreamParser(data => this.push(data))
      this.on('finish', () => this.streamParser.end())
    }

    _read (size) {}

    _write (chunk, encoding, callback) {
      this.streamParser.write(Buffer(chunk))
      callback()
    }
  }
  return new Outer()
}
/**
 * parses and return a stream of parsed 3mf data
 * @param {Object} parameters parameters for the parser
 * @param {Boolean} parameters.useWorker use web workers (browser only) defaults to true in browser
 * @return {Object} stream of parsed 3mf data in the form {}
 */
export default function makeParsedStream (parameters = {}) {
  const defaults = {
    useWorker: (detectEnv.isBrowser === true)
  }
  parameters = Object.assign({}, defaults, parameters)
  const {useWorker} = parameters

  return useWorker ? workerSpawner() : wrapper()
}
