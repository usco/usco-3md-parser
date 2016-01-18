
let detectEnv = require("composite-detect")

import assign from 'fast.js/object/assign'
import Rx from 'rx'
import assemble from './assemble'


//TODO: we need to modify the way Jam handles the data , as we do not only return a single geometry/mesh but
//a full hierarchy etc 
export default function parse(data, parameters={}){
  const defaults = {
    useWorker: (detectEnv.isBrowser===true)
  }
  parameters = assign({},defaults,parameters)
  const {useWorker} = parameters

  const obs = new Rx.ReplaySubject(1)

  if ( useWorker ) {    
    let worker = new Worker( "./worker.js" )//browserify 

    worker.onmessage = function( event ) {
      obs.onNext(event.data)
      obs.onNext({progress: 1, total:Math.NaN}) 
      obs.onCompleted()
    }
    worker.onerror = function( event ){
      obs.onError(`error: ${event.message}`)
    }

    worker.postMessage( { "data": data } )

    obs.catch(e=>worker.terminate()) 
  } 
  else 
  {
    assemble(data)
      /*.last(function (data, idx, obs) {
        return data._finished === true
      })*/ //WHY U NO WORK ??
      .subscribe(function(data){
        if(data._finished === true){
          obs.onNext(data)
        }
      })
  }


  return obs

}