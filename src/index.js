
let detectEnv = require("composite-detect")

import assign from 'fast.js/object/assign'
import Rx from 'rx'
import unpack from './unpack'
import parseRawXml from './parseRawXml'

import {parseVector3, parseIndices, createModelBuffers} from './parseHelpers'
import {makeModel} from './modelHelpers'


//TODO: we need to modify the way Jam handles the data , as we do not only return a single geometry/mesh but
//a full hierarchy etc 
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
    return {unit,version}
  }

  function extractMetadata(data){
    let tag = data.tag

    console.log("metaData",tag)
    let name    = tag.attributes['name']
    let value   = 0
    let result = {}
    result[name] = value
    return result
  }

  function vertexCoordinate(data){
    let {tag,start,end} = data
    let vertexCoords = parseVector3(tag)
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

  const metadata$ = rawData$
    .filter(d=>d.tag.name === "metadata" && d.start === true)
    .map(extractMetadata)

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

  const finishBuild$ = rawData$
    .filter(d=>d.tag.name === "build" && d.end === true)

  const item$ = rawData$
    .filter(d=>d.tag.name === "item" && d.start === true)

  //
  /*

  const components$  = rawData$
  const component$  = rawData$*/

  function metadata(state, input){
    let metadata = assign({}, state.metadata, input)
    state.metadata = metadata
    return state
  }

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
    state.objects[state.currentObject.id] = createModelBuffers( state.currentObject )

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

  function finishBuild(state,input){
    state._finished = true
    return state
  }

  ///
  const actions = {
    //metadata$
    
    vCoords$
    ,vIndices$

    ,startObject$
    ,finishObject$

    ,item$
    ,finishBuild$
  } 

  const updateFns = {
    metadata
    
    ,vCoords
    ,vIndices

    ,startObject
    ,finishObject

    ,item
    ,finishBuild


  }

  const defaultData = {
    metadata:{}
    ,objects:{}
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
    /*.last(function (data, idx, obs) {
      return data._finished === true
    })*/ //WHY U NO WORK ??
    .subscribe(function(data){
      if(data._finished === true){
        obs.onNext(data)
      }
    })

  return obs

  /*  const defaults = {
    useWorker: (detectEnv.isBrowser===true)
  }
  parameters = assign({},defaults,parameters)
  const {useWorker} = parameters*/

}