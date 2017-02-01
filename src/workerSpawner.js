import WorkerStream from './WorkerStream'
import webworkify from 'webworkify'

export default function workerSpawner () {
  const worker = webworkify(require('./worker.js'))
  const ws = new WorkerStream({path: worker})
  return ws
}
