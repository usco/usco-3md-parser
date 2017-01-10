import detectEnv from 'composite-detect'
import workerSpawner from './workerSpawner'
//import makeStreamParser from './parseStream'
//import through2 from 'through2'
import makeStreamParser from './parse'

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

export default function makeParsedStream (parameters = {}) {
  const defaults = {
    useWorker: (detectEnv.isBrowser === true)
  }
  parameters = Object.assign({}, defaults, parameters)
  const {useWorker} = parameters

  console.log('using worker?', useWorker)
  return useWorker ? workerSpawner() : makeStreamParser()
}
