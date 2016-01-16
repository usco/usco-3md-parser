
let detectEnv = require("composite-detect")

import assign from 'fast.js/object/assign'
import Rx from 'rx'
import unpack from './unpack'
import parseRawXml from './parseRawXml'

import {parseVector3, parseIndices} from './parseHelpers'
import {makeModel} from './modelHelpers'

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


  //rawData$.forEach(e=>console.log("rawData",e))

  const rootMeta$ = rawData$
    .filter(d=>d.tag.name === "3mf" && d.start === true)
    .map(threeMFInfo)

  const vCoords$ = rawData$
    .filter(d=>d.tag.name === "vertex" && d.start === true)
    .map(vertexCoordinate)

  const vIndices$ = rawData$
    .filter(d=>d.tag.name === "triangle" && d.start === true)
    .map(vertexIndices)

  const startObject$ = rawData$
    .filter(d=>d.tag.name === "object" && d.start === true)
   
  const finishObject$ = rawData$
    .filter(d=>d.tag.name === "object" && d.end === true)


  const build$ = rawData$
    .filter(d=>d.tag.name === "build" && d.end === true)

  const item$ = rawData$
    .filter(d=>d.tag.name === "item" && d.start === true)

  //
  /*const build$ = rawData$
  const item$  = rawData$

  const components$  = rawData$
  const component$  = rawData$*/


  function vCoords(state, input){
    state.currentObject._attributes.positions = state.currentObject._attributes.positions.concat(input)
    //state = assign(state, )
    return state
  }
  function vIndices(state, input){
    state.currentObject._attributes.indices = state.currentObject._attributes.indices.concat(input)
    return state
  }

  function startObject(state, input){
    let {tag,start,end} = input

    const object = ["id","name","type"]
      .reduce(function(result,key){
        if(key in tag.attributes){
          result[key] = tag.attributes[key]
        }
        return result 
      },{}) 

    state.currentObject = assign({}, state.currentObject, object)   
    return state
  }

  function finishObject(state, input){
    state.objects[state.currentObject.id] = state.currentObject
    
    state.currentObject =  {
      id:undefined
      ,_attributes:{
        positions:[]
        ,indices:[]
      }
    }
    return state
  }

  function item(state, input){
    let {tag,start,end} = input
    const item = ["objectid","transform","partnumber"]
      .reduce(function(result,key){
        if(key in tag.attributes){
          result[key] = tag.attributes[key]
        }
        return result 
      },{}) 

    state.build = state.build.concat([item])
    return state
  }

  ///
  const actions = {
    vCoords$
    ,vIndices$

    ,startObject$
    ,finishObject$

    ,item$
  } 

  const updateFns = {
    vCoords
    ,vIndices

    ,startObject
    ,finishObject

    ,item
  }

  const defaultData = {
    objects:{}
    ,build:[]

    ,currentObject:{
      id:undefined
      ,_attributes:{
        positions:[]
        ,indices:[]
      }
    }
  }

  const data$ = makeModel( defaultData, updateFns, actions )

  return data$

  /*return Rx.Observable.merge(rootMeta$, vCoords$, vIndices$, mesh$)
    .scan(function(cur,input){
      //console.log("current",cur,input)
      const out = assign({},cur,input)
      return out
    },{})*/




  return obs

}