// import makeStlStreamParser from './parseStream'
import makeStreamParser from './parse'

module.exports = function (self) {
  const streamParser = makeStreamParser(function(data){
    //console.log('done with parsing', data)
    self.postMessage(data)
    self.postMessage(null)
  })

  /*streamParser.on('data', function (data) {
    console.log('data from streamParser', data)
  })

  streamParser.on('error', function (err) {
    console.log('error', err)
  })

  streamParser.on('finish', function (err) {
    console.log('finish', err)
  })*/

  self.onmessage = function (event) {
    //console.log('message into worker', event)
    if (event.data === 'end') {
      streamParser.end()
    } else {
      streamParser.write(Buffer(event.data))
    }
  // self.postMessage(Buffer(event.data))
  // stlStreamParser(Buffer(event.data), null, (err, data) => self.postMessage(data.buffer, [data.buffer]))
  }
}
