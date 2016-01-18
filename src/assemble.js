import Rx from 'rx'
import assign from 'fast.js/object/assign'


import unpack from './unpack'
import parseRawXml from './parseRawXml'

import {parseVector3, parseIndices, createModelBuffers} from './parseHelpers'
import {makeModel} from './modelHelpers'

function threeMFInfo(data){
  let tag = data.tag
  let unit    = tag.attributes['unit']
  let version = tag.attributes['version']
  return {unit,version}
}

function extractMetadata(data){
  let {tag,text} = data

  let name    = tag.attributes['name']
  let value   = text
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


function makeActions(rawData$){
  const rootMeta$ = rawData$
    .filter(d=>d.tag.name === "3mf" && d.start)
    .map(threeMFInfo)

  const metadata$ = rawData$
    .filter(d=>d.tag.name === "metadata" && d.text)
    .map(extractMetadata)

  const vCoords$ = rawData$
    .filter(d=>d.tag.name === "vertex" && d.start)
    .map(vertexCoordinate)

  const vIndices$ = rawData$
    .filter(d=>d.tag.name === "triangle" && d.start)
    .map(vertexIndices)

  const startObject$ = rawData$
    .filter(d=>d.tag.name === "object" && d.start)
   
  const finishObject$ = rawData$
    .filter(d=>d.tag.name === "object" && d.end)

  const finishBuild$ = rawData$
    .filter(d=>d.tag.name === "build" && d.end)

  const item$ = rawData$
    .filter(d=>d.tag.name === "item" && d.start)

  return {
    metadata$
  
    ,vCoords$
    ,vIndices$

    ,startObject$
    ,finishObject$

    ,item$
    ,finishBuild$
  }
}

function makeReducers(){

  const updateFns = {
    metadata
    
    ,vCoords
    ,vIndices

    ,startObject
    ,finishObject

    ,item
    ,finishBuild
  }
  return updateFns
}
  
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
      ,name:undefined
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

export default function assemble(data){
  const rawData$ = unpack(data)
    .flatMap(parseRawXml)
    .share()

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

  const actions = makeActions(rawData$)
  const updateFns = makeReducers()
  const data$ = makeModel( defaultData, updateFns, actions )
  return data$
}

