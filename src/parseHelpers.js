export function parseText( value, toType , defaultValue)
{
  defaultValue = defaultValue || null

  if( value !== null && value !== undefined )
  {
    switch(toType)
    {
      case "float":
        value = parseFloat(value)
      break
      case "int":
        value = parseInt(value)
      break
      //default:
    }
  }
  else if (defaultValue !== null)
  {
    value = defaultValue
  }
  return value
}

/*export function parseAttribute( value , toType, defaultValue){
  attributes
}*/

export function parseColor( node , defaultValue)
{
  let color = defaultValue || null //let color = volumeColor !== null ? volumeColor : new THREE.Color("#ffffff")

  let r = parseText( node.r.value , "float",1.0)
  let g = parseText( node.g.value , "float", 1.0)
  let b = parseText( node.b.value , "float", 1.0)
  let a = ("a" in node) ? parseText( node.a.value , "float", 1.0) : 1.0
  color = [r,g,b,a]
  return color
}

export function hexToRgba(hex){
  hex = hex.replace('#','')
  let r = parseInt(hex.substring(0,2), 16)
  let g = parseInt(hex.substring(2,4), 16)
  let b = parseInt(hex.substring(4,6), 16)
  let a = parseInt(hex.substring(6,8), 16)
  return [r,g,b,a]
}

//normalize 0-255 values to 0-1
export function normalizeRgba(rgba){
  return rgba.map(v=>( +(v/255).toFixed(2) ) ) 
}

export function parseVector3( node, prefix, defaultValue )
{
  let coords = null
  prefix =  prefix || "" 
  defaultValue = defaultValue || 0.0

  let x = (prefix+"x" in node.attributes) ? parseText( node.attributes[prefix+"x"], "float" , defaultValue) : defaultValue
  let y = (prefix+"y" in node.attributes) ? parseText( node.attributes[prefix+"y"], "float" , defaultValue) : defaultValue
  let z = (prefix+"z" in node.attributes) ? parseText( node.attributes[prefix+"z"], "float" , defaultValue) : defaultValue

  coords = [x,y,z]
  return coords
}

export function parseIndices( node ){
  let prefix = ''
  let defaultValue = 0
  let v1 = parseText( node.attributes[prefix+"v1"], "int", defaultValue)
  let v2 = parseText( node.attributes[prefix+"v2"], "int", defaultValue)
  let v3 = parseText( node.attributes[prefix+"v3"], "int", defaultValue)

  return [v1, v2, v3]
}

export function parseMapCoords( node, prefix, defaultValue)
{
  //console.log("parsing map coords", node, ("btexid" in node) , node.btexid)
  //get vertex UVs (optional)
  //rtexid, gtexid, btexid
  
  let rtexid = ("rtexid" in node) ? parseText( node["rtexid"], "int" , null) : null
  let gtexid = ("gtexid" in node) ? parseText( node["gtexid"], "int" , defaultValue) : null
  let btexid = ("btexid" in node) ? parseText( node["btexid"], "int" , defaultValue) : null

  let u1 = ("u1" in node) ? parseText( node["u1"].value, "float" , defaultValue) : null
  let u2 = ("u2" in node) ? parseText( node["u2"].value, "float" , defaultValue) : null
  let u3 = ("u3" in node) ? parseText( node["u3"].value, "float" , defaultValue) : null

  let v1 = ("v1" in node) ? parseText( node["v1"].value, "float" , defaultValue) : null
  let v2 = ("v2" in node) ? parseText( node["v2"].value, "float" , defaultValue) : null
  let v3 = ("v3" in node) ? parseText( node["v3"].value, "float" , defaultValue) : null

  //console.log("textures ids", rtexid,gtexid,btexid,"coords", u1,u2,u3,"/", v1,v2,v3)
  //face.materialIndex  = rtexid
  //face.materialIndex  = 0

  let uv1 = (u1 !== null && v1 !=null) ? [u1,v1] : null
  let uv2 = (u2 !== null && v2 !=null) ? [u2,v2] : null 
  let uv3 = (u3 !== null && v3 !=null) ? [u3,v3] : null
  
  let mappingData = {matId:0, uvs:[uv1,uv2,uv3]}
  //currentGeometry.faceVertexUvs[ 0 ].push( [uv1,uv2,uv3])
  return mappingData
}



export function createModelBuffers ( modelData ) {
  //console.log("creating model buffers")//modelData, modelData._attributes)

  /*let faces     = modelData._attributes.indices.length/3
  let colorSize = 3

  //console.log("faces",modelData._attributes.positions.length, modelData._attributes.indices.length, faces)

  let positions = new Float32Array( modelData._attributes.positions.length )
  //let normals   = new Float32Array( faces * 3 * 3 )
  let indices   = new Uint32Array( modelData._attributes.indices.length  )

  if(modelData._attributes.colors.length>0){
    let colors  = new Float32Array( modelData._attributes.colors.length  )
    colors.set( modelData._attributes.colors )
  }

  //vertices.set( modelData.position );
  //normals.set( modelData.normal );
  //indices.set( modelData.indices );

  positions.set( modelData._attributes.positions )
  indices.set( modelData._attributes.indices )*/

  //other implementation
  const dataTypes = {"positions":Float32Array, "indices":Uint32Array, "normals":Float32Array, "colors":Float32Array}
  
  let output = ["positions", "normals", "colors", "indices"]
    .reduce(function(result,key){
      if(key in modelData._attributes){
        let data = modelData._attributes[key]
        
        let dataBuff = new dataTypes[key]( data.length )
        dataBuff.set( data )

        result[key] = dataBuff
      }
      return result 
    },{}) 


  output.id   = modelData.id
  output.name = modelData.name

  //console.log("here", output.positions, positions, output.indices, indices)
  return output //{id:modelData.id, name:modelData.name, positions, indices}


  /*console.log("creating model buffers",modelData)
  
  var faces = modelData.faceCount
  var colorSize =3
  
  var vertices = new Float32Array( faces * 3 * 3 )
  var normals = new Float32Array( faces * 3 * 3 )
  var colors = new Float32Array( faces *3 * colorSize )
  var indices = new Uint32Array( faces * 3  )
  
  vertices.set( modelData._attributes.position )
  normals.set( modelData._attributes.normal )
  indices.set( modelData._attributes.indices )
  colors.set( modelData._attributes.vcolors )

  /*var vs = require('./vertShader.vert')()
  var fs = require('./fragShader.frag')()
  
  var material = new THREE.RawShaderMaterial( {

          uniforms: {
            time: { type: "f", value: 1.0 }
          },
          vertexShader: vs,
          fragmentShader: fs,
          side: THREE.DoubleSide,
          transparent: true

        } )

  var color = this.defaultColor 
  var material = new this.defaultMaterialType({color:0XFFFFFF,vertexColors: THREE.VertexColors})
  var mesh = new THREE.Mesh( geometry, material )*/
  //return mesh
}