import mat4 from 'gl-mat4'

export function parseText (value, toType, defaultValue) {
  defaultValue = defaultValue || null

  if (value !== null && value !== undefined) {
    switch (toType) {
      case 'float':
        value = parseFloat(value)
        break
      case 'int':
        value = parseInt(value, 10)
        break
    }
  }
  else if (defaultValue !== null) {
    value = defaultValue
  }
  return value
}

export function parseColor (node, defaultValue) {
  let color = defaultValue || null // let color = volumeColor !== null ? volumeColor : new THREE.Color("#ffffff")

  const r = parseText(node.r.value, 'float', 1.0)
  const g = parseText(node.g.value, 'float', 1.0)
  const b = parseText(node.b.value, 'float', 1.0)
  const a = ('a' in node) ? parseText(node.a.value, 'float', 1.0) : 1.0
  color = [r, g, b, a]
  return color
}

export function hexToRgba (hex) {
  hex = hex.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const a = parseInt(hex.substring(6, 8), 16)
  return [r, g, b, a]
}

// normalize 0-255 values to 0-1
export function normalizeRgba (rgba) {
  return rgba.map(v => (+(v / 255).toFixed(2)))
}

export function parseVector3 (node, prefix, defaultValue) {
  prefix = prefix || ''
  defaultValue = defaultValue || 0.0

  const x = (prefix + 'x' in node.attributes) ? parseText(node.attributes[prefix + 'x'], 'float', defaultValue) : defaultValue
  const y = (prefix + 'y' in node.attributes) ? parseText(node.attributes[prefix + 'y'], 'float', defaultValue) : defaultValue
  const z = (prefix + 'z' in node.attributes) ? parseText(node.attributes[prefix + 'z'], 'float', defaultValue) : defaultValue
  return [x, y, z]
}

export function parseIndices (node) {
  let prefix = ''
  let defaultValue = 0
  let v1 = parseText(node.attributes[prefix + 'v1'], 'int', defaultValue)
  let v2 = parseText(node.attributes[prefix + 'v2'], 'int', defaultValue)
  let v3 = parseText(node.attributes[prefix + 'v3'], 'int', defaultValue)

  if (v1 === v2 || v1 === v3 || v2 === v3) {
    throw new Error('the indices v1,v2,v3 should be different.')
  }

  return [v1, v2, v3]
}

export function parseMapCoords (node, prefix, defaultValue) {
  // console.log("parsing map coords", node, ("btexid" in node) , node.btexid)
  // get vertex UVs (optional)
  // rtexid, gtexid, btexid

  let rtexid = ('rtexid' in node) ? parseText(node['rtexid'], 'int', null) : null
  let gtexid = ('gtexid' in node) ? parseText(node['gtexid'], 'int', defaultValue) : null
  let btexid = ('btexid' in node) ? parseText(node['btexid'], 'int', defaultValue) : null

  let u1 = ('u1' in node) ? parseText(node['u1'].value, 'float', defaultValue) : null
  let u2 = ('u2' in node) ? parseText(node['u2'].value, 'float', defaultValue) : null
  let u3 = ('u3' in node) ? parseText(node['u3'].value, 'float', defaultValue) : null

  let v1 = ('v1' in node) ? parseText(node['v1'].value, 'float', defaultValue) : null
  let v2 = ('v2' in node) ? parseText(node['v2'].value, 'float', defaultValue) : null
  let v3 = ('v3' in node) ? parseText(node['v3'].value, 'float', defaultValue) : null

  // console.log("textures ids", rtexid,gtexid,btexid,"coords", u1,u2,u3,"/", v1,v2,v3)
  // face.materialIndex  = rtexid
  // face.materialIndex  = 0

  let uv1 = (u1 !== null && v1 != null) ? [u1, v1] : null
  let uv2 = (u2 !== null && v2 != null) ? [u2, v2] : null
  let uv3 = (u3 !== null && v3 != null) ? [u3, v3] : null

  let mappingData = {matId: 0, uvs: [uv1, uv2, uv3]}
  // currentGeometry.faceVertexUvs[ 0 ].push( [uv1,uv2,uv3])
  return mappingData
}

export function matrixFromTransformString (transform) {
  transform = transform.split(' ').map(parseFloat)
  // console.log('matrixFromTransformString',transform)

  // Transformation is saved as:
  // M00 M01 M02 0.0
  // M10 M11 M12 0.0
  // M20 M21 M22 0.0
  // M30 M31 M32 1.0

  // reusing some of the Cura 3mf parser code
  let mat = mat4.create()
  // We are switching the row & cols as that is how everyone else uses matrices!
  // set Rotation & Scale
  mat[0] = transform[0]
  mat[1] = transform[3]
  mat[2] = transform[6]

  mat[4] = transform[3]
  mat[5] = transform[4]
  mat[6] = transform[5]

  mat[8] = transform[6]
  mat[9] = transform[7]
  mat[10] = transform[8]

  return mat
}
