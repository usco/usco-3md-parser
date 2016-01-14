
let detectEnv = require("composite-detect")

import assign from 'fast.js/object/assign'
import Rx from 'rx'
import unpack from './unpack'



export default function parse(data, parameters={}){
  const defaults = {
    useWorker: (detectEnv.isBrowser===true)
  }
  parameters = assign({},defaults,parameters)
  const {useWorker} = parameters

  const obs = new Rx.ReplaySubject(1)


  let rootObject = {}
  rootObject.name = "rootScene"//TODO: change storage of data : ie don't put everything under a single object


  const rawData$ = unpack(data)


  return rawData$


  return obs

}