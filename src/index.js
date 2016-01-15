
let detectEnv = require("composite-detect")

import assign from 'fast.js/object/assign'
import Rx from 'rx'
import unpack from './unpack'
import parseRawXml from './parseRawXml'

import {parseVector3, parseIndices} from './parseHelpers'

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
    .flatMap(parseRawXml)
    .share()


  function threeMFInfo(data){
    let tag = data.tag
    let unit    = tag.attributes['unit']
    let version = tag.attributes['version']
    //let currentItem   = rootObject
    return {unit,version}
  }

  function vertexCoordinate(data){
    let {tag,start,end} = data
    //console.log("tag" ,tag)
    let vertexCoords = parseVector3(tag)
    //currentObject._attributes["position"].push( vertexCoords[0],vertexCoords[1],vertexCoords[2] )
    return vertexCoords
  }

  function vertexIndices(data){
    let {tag,start,end} = data
    let vertexIndices = parseIndices(tag)
    return vertexIndices
  }

  function mesh(data){
    let {tag,start,end} = data

    return ["id","name","type"]
      .reduce(function(result,key){
        if(key in tag.attributes){
          result[key] = tag.attributes[key]
        }
        return result 
      },{}) 
  }


  function build(data){
    let {tag,start,end} = data
    return  
  }

  function item(data){
    let {tag,start,end} = data
    return ["objectid","transform","partnumber"]
      .reduce(function(result,key){
        if(key in tag.attributes){
          result[key] = tag.attributes[key]
        }
        return result 
      },{}) 
  }

  function component(data){
    let {tag,start,end} = data
    return ["objectid","transform"]
      .reduce(function(result,key){
        if(key in tag.attributes){
          result[key] = tag.attributes[key]
        }
        return result 
      },{}) 
  }

  const rootMeta$ = rawData$
    .filter(d=>d.tag.name === "3mf")
    .map(threeMFInfo)

  const vCoords$ = rawData$
    .filter(d=>d.tag.name === "vertex")
    .map(vertexCoordinate)
    .scan(function(state,input){
      return state.concat(input)
    },[])
    .map( v=> ({positions:v}) )

  const vIndices$ = rawData$
    .filter(d=>d.tag.name === "triangle")
    .map(vertexIndices)
    .scan(function(state,input){
      return state.concat(input)
    },[])
    .map( v=> ({indices:v}) )

  const mesh$ = rawData$
    .filter(d=>d.tag.name === "object")
    .map( mesh )
    .map( function(mesh) {
      let output = {}
      output[mesh.id] = mesh
      return output
    })

  //
  const build$ = rawData$
  const item$  = rawData$

  const components$  = rawData$
  const component$  = rawData$

  return Rx.Observable.merge(rootMeta$, vCoords$, vIndices$, mesh$)
    .scan(function(cur,input){
      //console.log("current",cur,input)
      const out = assign({},cur,input)
      return out
    },{})


  return rawData$


  return obs

}