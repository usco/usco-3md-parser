import Rx from 'rx'
import assign from 'fast.js/object/assign'

import unpack from './unpack'
import parseRawXml from './parseRawXml'

import {parseVector3, parseIndices, hexToRgba, normalizeRgba, createModelBuffers} from './parseHelpers'
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

  const output = assign({},colorIds,vertexIndices(data))
  return output
  //return colorIds
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
    color = normalizeRgba(color)
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

  const vNormals$ = triangle$
    .map(vertexIndices)

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
    ,vNormals$
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
    ,vNormals
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

  function vNormals(state, input){
    //see specs : A triangle face normal (for triangle ABC, in that order) throughout this specification is defined as
    //a unit vector in the direction of the vector cross product (B - A) x (C - A).
    //(B - A) x (C - A).
    //const normalIndices = [input[0], input[1], input[2]]
    //console.log("input",input, state.currentObject )
    const positions = state.currentObject._attributes.positions
    
    const A      = [ positions[ input[0] ], positions[ input[0]+1] , positions[ input[0]+2] ]
    const B      = [ positions[ input[1] ], positions[ input[1]+1] , positions[ input[1]+2] ]
    const C      = [ positions[ input[2] ], positions[ input[2]+1] , positions[ input[2]+2] ]


    function cross(a,b){
      let ax = a[0], ay = a[1], az = a[2]
      let bx = b[0], by = b[1], bz = b[2]

      let x = ay * bz - az * by
      let y = az * bx - ax * bz
      let z = ax * by - ay * bx 
      return [x,y,z]
    }
    function sub(a,b){
      return [
        a[0] - b[0]
        , a[1] - b[1]
        , a[2] - b[2]
      ]
    }

    function length(v){
      return Math.sqrt( v[0] * v[0] + v[1] * v[1] + v[2] * v[2] )
    }

    function multiplyScalar(v, s){
      return [ v[0] * s , v[1] * s , v[2] * s ]
    }
    function divideScalar(vector, scalar){
      return multiplyScalar( vector, (1 / scalar) )
    }

    function normalize(v){
      return divideScalar( v, length(v) )
    }

    const normal = normalize( cross( sub(B,A), sub(C,A) ) )

    //const normal = (B - A) * (C - A)
    //console.log("A",A,"B",B,"C",C)
    //console.log("normal basic",normal)

    state.currentObject._attributes.normals = state.currentObject._attributes.normals.concat(normal)

    return state
  }

  function vColors(state, input){
    //FIXME: deal with color GROUPS
    //console.log("vColors",input)
    let colorGroup = state.colors[input.pid]

    const p1 = 'p1' in input 
    const p2 = 'p2' in input
    const p3 = 'p3' in input

    const p1Decides = p1 && ! p2 && ! p3
    const allP      = p1 && p2 && p3 

    let colors = []

    function assignAtIndex(target, startIndex, data){
      for(let i=0;i<4;i++){
        target[startIndex+i] = data[i]
      }
    }

    function assignAllAtIndices(target, indices, data){
      indices.forEach(function(cindex,index){
        //console.log("assignAllAtIndices target",target,"indices", indices,"index", cindex,"data",data, "indexData",  data[index])
        assignAtIndex(target, cindex*4, data[index])
      }) 
    }
    const colorIndices = [input[0], input[1], input[2]]

    /*if(state.currentObject._attributes.colors.length ===0){
      state.currentObject._attributes.colors = new Array(7)
    }*/

    if(allP){
      //colors = colorGroup[input.p1].concat( colorGroup[input.p2], colorGroup[input.p3] )
      const values = [colorGroup[input.p1], colorGroup[input.p2], colorGroup[input.p3]]
      assignAllAtIndices(state.currentObject._attributes.colors, colorIndices, values)
    }else if(p1Decides){
      const p1Color = colorGroup[input.p1]
      //colors = p1Color.concat( p1Color, p1Color )
      const values = [p1Color,p1Color,p1Color]
      assignAllAtIndices(state.currentObject._attributes.colors, colorIndices, values)
    }

    if(colors.length >0 ){
      //state.currentObject._attributes.colors = state.currentObject._attributes.colors.concat(colors)
    }

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
        ,normals:[]
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
        ,normals:[]
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

