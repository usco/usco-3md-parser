const Duplex = require('stream').Duplex

/* utility to wrap a web worker and turn it into a stream*/
export default class WorkerStream extends Duplex {
  constructor ({path, objectOut = true}) {
    super({readableObjectMode: objectOut})
    this.worker = typeof path === 'string' ? new Worker(path) : path

    this.requests = 0
    this.responses = 0
    this.doneWriting = false

    this.bufferedData = undefined
    this.requestedDataQueue = []

    this.requestedTotal = 0
    this.sentTotal = 0

    this.worker.onmessage = (e) => {
      const data = objectOut ? e.data : Buffer(e.data)
      this.push(data)
      this.responses += 1
      this._done()
    }

    this.worker.onerror = (err) => {
      this.emit('error', err)
    }
  }

  _dealWithData (e) {
    console.log('dealWithData')
    if(e){
      const data = Buffer(e.data)
      //console.log('recieved', this.requests)
      this.bufferedData = this.bufferedData ? Buffer.concat([this.bufferedData, data]) : data
    }


    if (this.bufferedData && this.requestedDataQueue.length > 0) {
      const size = this.requestedDataQueue[0]
      const reqChunk = this.bufferedData.slice(0, size)
      this.push(reqChunk) // actual emits requested chunk size

      this.bufferedData = this.bufferedData.slice(size)
      this.sentTotal += reqChunk.length
      console.log('sentTotal', this.sentTotal)
      this.requestedDataQueue.shift()
      //console.log(this.requestedDataQueue.length)
      //this.responses += 1
    }
    this._done()
  }

  _done () {
    //if (this.requestedDataQueue.length === 0 && this.doneWriting)
    if(this.requests === this.responses && this.doneWriting)
    {
      console.log('done FOR REALZ')
      //this.emit('end')
      this.push(null)
    }
  }

  end (data) {
    //console.log('done writing', this.requests, this.responses)
    this.worker.postMessage('end')
    this.doneWriting = true
    this._done()
  }

  _write (chunk, encoding, next) {
    //console.log('_write to worker', chunk.toString('utf8'))
    this.requests +=1
    this.worker.postMessage(chunk.buffer, [chunk.buffer])
    next(null, chunk)
  }

  _read (size) {
    //console.log('consumer asking read', size)
    this.requestedDataQueue.push(size)
    this.requestedTotal += size
    //console.log('requestedTotal',this.requestedTotal)

    //this._dealWithData()
  }
}
