const Duplex = require('stream').Duplex

class Formatter extends Duplex {
  constructor (processorFn) {
    super({readableObjectMode: true})
    this.body = []
    this.on('finish', function () {
      const result = processorFn(this.body)
      this.push(result)
      this.emit('end')
    })
  }

  _read (size) {}

  _write (chunk, encoding, callback) {
    this.body.push(chunk)
    callback()
  }

  end () {
    const self = this
    setTimeout(() => self.emit('finish'), 0.001) // WTH ??withouth this, finish is emitted too early
  }
}

export default function concatStream (processorFn) {
  return new Formatter(processorFn)
}
