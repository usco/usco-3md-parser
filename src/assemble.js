import Rx from 'rx'
import assign from 'fast.js/object/assign'

import unpack from './unpack'
import parseRawXml from './parseRawXml'

import {parseVector3, parseIndices, hexToRgba, createModelBuffers} from './parseHelpers'
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

function vertexColors(data){
  let {tag,start,end} = data

  let colorIds = ["pid","p1","p2","p3"]
    .reduce(function(result,key){
      if(key in tag.attributes){
        let value = tag.attributes[key]
        result[key] = parseInt(value)
      }
      return result 
    },{}) 

  return colorIds
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


function extractColor(data){
  let {tag} = data
  let color = tag.attributes['color']
  if(color){
    color = hexToRgba(color)
  }
  return color
}

function extractColorGroup(data){
  let {tag} = data

  let colorgroupData = ["id"]
    .reduce(function(result,key){
      if(key in tag.attributes){
        let value = tag.attributes[key]
        result[key] = parseInt(value)
      }
      return result 
    },{}) 

  return colorgroupData
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


  const triangle$ = rawData$
    .filter(d=>d.tag.name === "triangle" && d.start)
    .share()

  const vIndices$ = triangle$
    .map(vertexIndices)

  const vColors$ = triangle$
    .filter( data => ( data.tag.attributes.hasOwnProperty("pid") && ( data.tag.attributes.hasOwnProperty("p1") || data.tag.attributes.hasOwnProperty("p2") || data.tag.attributes.hasOwnProperty("p3") ) ) ) 
    .map(vertexColors)

  const startObject$ = rawData$
    .filter(d=>d.tag.name === "object" && d.start)
   
  const finishObject$ = rawData$
    .filter(d=>d.tag.name === "object" && d.end)

  const finishBuild$ = rawData$
    .filter(d=>d.tag.name === "build" && d.end)

  const item$ = rawData$
    .filter(d=>d.tag.name === "item" && d.start)

  //colors & materials
  const colorGroup$ = rawData$
    .filter(d=>d.tag.name === "m:colorgroup" && d.end)
    .map(extractColorGroup)

  const color$ = rawData$
    .filter(d=>d.tag.name === "m:color" && d.start)
    .map(extractColor)

  return {
    metadata$

    ,color$
    ,colorGroup$

    ,vCoords$
    ,vIndices$
    ,vColors$

    ,startObject$
    ,finishObject$

    ,item$
    ,finishBuild$
  }
}

function makeReducers(){

  const updateFns = {
    metadata

    ,color
    ,colorGroup
    
    ,vCoords
    ,vIndices
    ,vColors

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
  function vColors(state, input){
    //FIXME: deal with color GROUPS
    //console.log("vColors",input)
    let colorGroup = state.colors[input.pid]

    let p1color = colorGroup[input.p1]//not sure
    let p2color = colorGroup[input.p2]//not sure
    let p3color = colorGroup[input.p3]//not sure

    let color   = p1color.concat(p2color).concat(p3color)
      .filter(e=>e!==undefined)
    //console.log("vColors2",color)

    state.currentObject._attributes.colors = state.currentObject._attributes.colors.concat(color)
    return state
  }

  function color(state, input){
    //state.colors = state.colors.concat( input )
    state.currentColorGroup.push(input)
    return state
  }

  function colorGroup(state, input){
    state.colors[input.id] = state.currentColorGroup
    state.currentColorGroup=[]
    return state
  }

  function startObject(state, input){
    let {tag,start,end} = input

    const object = ["id", "name", "type", "pid"]
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
        ,colors:[]
      }
    }
    return state
  }

  function item(state, input){
    let {tag,start,end} = input
    const item = ["objectid","transform","partnumber"]
      .reduce(function(result,key){
        if(key in tag.attributes){
          
          if(key === 'transform'){
            result['transforms'] = tag.attributes[key].split(' ').map(t=>parseFloat(t))
          }else{
            result[key] = tag.attributes[key]
          }
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
    ,colors:{}

    ,currentObject:{
      id:undefined
      ,_attributes:{
        positions:[]
        ,indices:[]
        ,colors:[]
      }
    }

    ,currentColorGroup:[]
  }

  const actions = makeActions(rawData$)
  const updateFns = makeReducers()
  const data$ = makeModel( defaultData, updateFns, actions )
  return data$
}

