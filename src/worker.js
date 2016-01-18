import assemble from './assemble'

self.onmessage = function( event ) {
  
  let data = event.data
  data = data.data

  let result = assemble(data)
  
  self.postMessage( {data:result} )
  self.close()

}
