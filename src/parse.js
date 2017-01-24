const concat = require('concat-stream')
const JSZip = require('jszip')

import parse from './parse2'

import mat4 from 'gl-mat4'

function resolveOne (zip, path, isRoot = false) {
  return new Promise(function (resolve, reject) {
    const hasFile = 'files' in zip && zip.files.hasOwnProperty(path)
    if (hasFile) {
      zip.file(path).nodeStream().pipe(parse({callback: resolve, isRoot}))
    } else {
      console.warn(`no such file ${path} in this 3MF file`)
      resolve(undefined)
    // reject(new Error(`no such file ${path} in this 3MF file`))
    }
  })
}

function generateUUID () {
  var d = new Date().getTime()
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (d + Math.random() * 16) % 16 | 0
    d = Math.floor(d / 16)
    return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
  return uuid
}


function assembleStuff (data) {
  console.log(data.transforms.scale)
  const rootScale = data.transforms.scale
  function lookup (id) {
    return data.objects[id]
  }

  function updateComponents (object, matrix, parent) {
    matrix = matrix ? matrix : mat4.create()
    if (object.transforms) { // if the current build item has transforms apply them
      mat4.multiply(matrix, matrix, object.transforms)
    }
    object.transforms = {matrix}
    object.parent = parent
    object.components = object.components.map(function (component) {
      // console.log('component', lookup(component.objectid))
      return updateComponents(lookup(component.objectid), null, object)
    })
    object.children = object.components
    delete object.components
    if (object.geometry && object.geometry.positions.length === 0) {
      delete object.geometry
    }
    return object
  }

  data.build.forEach(function (item) {
    // console.log(item)
    let matrix = mat4.create()
    mat4.scale(matrix, matrix, rootScale)
    if (item.transforms) { // if the current build item has transforms apply them
      mat4.multiply(matrix, matrix, item.transforms)
    }
    let object = lookup(item.objectid)
    object = updateComponents(object, matrix, null)

    console.log(object)
  })
}

function sUUID () {
  return Math.random().toString(36).slice(-12)
}

function assembleStuff2 (data) {
  console.log(data.transforms.scale)
  const rootScale = data.transforms.scale
  function lookup (id) {
    return data.objects[id]
  }
  function makeEntityComponent (type, data) {
  }

  let entities = []
  let entityComponents = []
  data.build.forEach(function (item) {
    // console.log(item)
    let matrix = mat4.create()
    mat4.scale(matrix, matrix, rootScale)
    if (item.transforms) { // if the current build item has transforms apply them
      mat4.multiply(matrix, matrix, item.transforms)
    }
    mat4.scale(matrix, matrix, rootScale)
    let object = lookup(item.objectid)
    // object = updateComponents(object, matrix, null)

    // make entities and components
    let entity = {uuid: sUUID(), id: object.objectid, components: []}

    let geometryComponent
    let transformsComponent
    let metaComponent
    if (object.geometry && object.geometry.positions.length >= 0) {
      geometryComponent = {type: 'geometry', uuid: sUUID(), data: object.geometry}
      entityComponents.push(geometryComponent)
      entity.components.push(geometryComponent.uuid)
    }

    transformsComponent = {type: 'transform', uuid: sUUID(), data: {matrix}, parentUid: undefined}
    metaComponent = {type: 'meta', uuid: sUUID(), data: {name: object.name}}

    entityComponents.push(transformsComponent)
    entityComponents.push(metaComponent)

    entity.components.push(transformsComponent.uuid)
    entity.components.push(metaComponent.uuid)
    entities.push(entity)
  })
  const containerComponent = Object.assign({uuid: sUUID() }, data.metadata)
  entityComponents.push(containerComponent)
  return {components : entityComponents, entities}
}

export default function makeStreamParser (onDone) {
  let finalCallback = function (data) {
    new JSZip().loadAsync(data).then(function (zip) {
      resolveOne(zip, '3D/3dmodel.model', true)
        .then(function (rootData) {
          // console.log('rootData', rootData)
          Promise.all(rootData.subResources.map(path => resolveOne(zip, path)))
            .then(function (filesData) {
              let result = {}
              filesData
                .filter(x => x !== undefined)
                .forEach(function (fileData, index) {
                  result[rootData.subResources[index]] = fileData
                })
                // console.log('we have all the data', result)

              // FIXME : awfull hack
              // console.log('filesData', rootData.build)
              rootData.build = rootData.build.map(function (item, newIndex) {
                let id = item.objectid
                let path = item.path
                let resolvedPath = result[path]
                if (!resolvedPath) {return item}
                let resolved = resolvedPath.objects[id]
                rootData.objects[newIndex] = resolved
                return Object.assign({}, item, {objectid: newIndex})
              }).filter(x => x !== undefined)

              // this always gets called, even if there are not sub resources
              onDone(rootData)//assembleStuff(rootData))
            })
        })
    })
  }
  return concat(finalCallback)
}
