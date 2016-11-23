import WorkerStream from './WorkerStream'
import WebWorkify from 'WebWorkify'
//import foo from './foo'
export default function workerSpawner () {
  const worker = WebWorkify(require('./worker.js'))
  const ws = new WorkerStream({path: worker})
  return ws
}
