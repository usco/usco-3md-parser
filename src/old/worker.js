import assemble from './assemble'

self.onmessage = function (event) {
  let data = event.data
  data = data.data

  assemble(data)
    .subscribe(function (data) {
      if (data._finished === true) {
        self.postMessage({data})
        self.close()
      }
    })
}
