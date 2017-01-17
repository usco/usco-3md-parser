const concat = require('concat-stream')
const JSZip = require('jszip')

import parse from './parse2'

function resolveOne (zip, path, isRoot = false) {
  return new Promise(function (resolve, reject) {
    const hasFile = 'files' in zip && zip.files.hasOwnProperty(path)
    console.log(zip, path, zip.files[path], hasFile)
    if (hasFile) {
      zip.file(path).nodeStream().pipe(parse({callback: resolve, isRoot}))
    } else {
      console.warn(`no such file ${path} in this 3MF file`)
      resolve(undefined)
    // reject(new Error(`no such file ${path} in this 3MF file`))
    }
  })
}

export default function makeStreamParser (onDone) {
  let finalCallback = function (data) {
    new JSZip().loadAsync(data).then(function (zip) {
      resolveOne(zip, '3D/3dmodel.model', true)
        .then(function (rootData) {
          console.log('rootData', rootData)
          Promise.all(rootData.subResources.map(path => resolveOne(zip, path)))
            .then(function (filesData) {
              let result = {}
              filesData
                .filter(x => x !== undefined)
                .forEach(function (fileData, index) {
                  result[rootData.subResources[index]] = fileData
                })
              console.log('we have all the data', result)

              // FIXME : awfull hack
              rootData.build = rootData.build.map(function (item, newIndex) {
                let id = item.objectid
                let path = item.path
                let resolvedPath = result[path]
                if (!resolvedPath) {return undefined}
                let resolved = resolvedPath.objects[id]
                rootData.objects[newIndex] = resolved
                return {objectid: newIndex}
              }).filter(x => x !== undefined)
              onDone(rootData)
            })
          if (rootData.subResources.length === 0) {
            onDone(rootData)
          }
        //
        })
    })
  }
  return concat(finalCallback)
}
