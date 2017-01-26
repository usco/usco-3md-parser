'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = makeStreamParser;

var _parse = require('./parse2');

var _parse2 = _interopRequireDefault(_parse);

var _glMat = require('gl-mat4');

var _glMat2 = _interopRequireDefault(_glMat);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var concat = require('concat-stream');
var JSZip = require('jszip');

function resolveOne(zip, path) {
  var isRoot = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  return new Promise(function (resolve, reject) {
    var hasFile = 'files' in zip && zip.files.hasOwnProperty(path);
    if (hasFile) {
      zip.file(path).nodeStream().pipe((0, _parse2.default)({ callback: resolve, isRoot: isRoot }));
    } else {
      console.warn('no such file ' + path + ' in this 3MF file');
      resolve(undefined);
      // reject(new Error(`no such file ${path} in this 3MF file`))
    }
  });
}

function generateUUID() {
  var d = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == 'x' ? r : r & 0x3 | 0x8).toString(16);
  });
  return uuid;
}

function assembleStuff(data) {
  console.log(data.transforms.scale);
  var rootScale = data.transforms.scale;
  function lookup(id) {
    return data.objects[id];
  }

  function updateComponents(object, matrix, parent) {
    matrix = matrix ? matrix : _glMat2.default.create();
    if (object.transforms) {
      // if the current build item has transforms apply them
      _glMat2.default.multiply(matrix, matrix, object.transforms);
    }
    object.transforms = { matrix: matrix };
    object.parent = parent;
    object.components = object.components.map(function (component) {
      // console.log('component', lookup(component.objectid))
      return updateComponents(lookup(component.objectid), null, object);
    });
    object.children = object.components;
    delete object.components;
    if (object.geometry && object.geometry.positions.length === 0) {
      delete object.geometry;
    }
    return object;
  }

  data.build.forEach(function (item) {
    // console.log(item)
    var matrix = _glMat2.default.create();
    _glMat2.default.scale(matrix, matrix, rootScale);
    if (item.transforms) {
      // if the current build item has transforms apply them
      _glMat2.default.multiply(matrix, matrix, item.transforms);
    }
    var object = lookup(item.objectid);
    object = updateComponents(object, matrix, null);

    console.log(object);
  });
}

function sUUID() {
  return Math.random().toString(36).slice(-12);
}

function assembleStuff2(data) {
  console.log(data.transforms.scale);
  var rootScale = data.transforms.scale;
  function lookup(id) {
    return data.objects[id];
  }
  function makeEntityComponent(type, data) {}

  var entities = [];
  var entityComponents = [];
  data.build.forEach(function (item) {
    // console.log(item)
    var matrix = _glMat2.default.create();
    _glMat2.default.scale(matrix, matrix, rootScale);
    if (item.transforms) {
      // if the current build item has transforms apply them
      _glMat2.default.multiply(matrix, matrix, item.transforms);
    }
    _glMat2.default.scale(matrix, matrix, rootScale);
    var object = lookup(item.objectid);
    // object = updateComponents(object, matrix, null)

    // make entities and components
    var entity = { uuid: sUUID(), id: object.objectid, components: [] };

    var geometryComponent = void 0;
    var transformsComponent = void 0;
    var metaComponent = void 0;
    if (object.geometry && object.geometry.positions.length >= 0) {
      geometryComponent = { type: 'geometry', uuid: sUUID(), data: object.geometry };
      entityComponents.push(geometryComponent);
      entity.components.push(geometryComponent.uuid);
    }

    transformsComponent = { type: 'transform', uuid: sUUID(), data: { matrix: matrix }, parentUid: undefined };
    metaComponent = { type: 'meta', uuid: sUUID(), data: { name: object.name } };

    entityComponents.push(transformsComponent);
    entityComponents.push(metaComponent);

    entity.components.push(transformsComponent.uuid);
    entity.components.push(metaComponent.uuid);
    entities.push(entity);
  });
  var containerComponent = Object.assign({ uuid: sUUID() }, data.metadata);
  entityComponents.push(containerComponent);
  return { components: entityComponents, entities: entities };
}

function makeStreamParser(onDone) {
  var finalCallback = function finalCallback(data) {
    new JSZip().loadAsync(data).then(function (zip) {
      resolveOne(zip, '3D/3dmodel.model', true).then(function (rootData) {
        // console.log('rootData', rootData)
        Promise.all(rootData.subResources.map(function (path) {
          return resolveOne(zip, path);
        })).then(function (filesData) {
          var result = {};
          filesData.filter(function (x) {
            return x !== undefined;
          }).forEach(function (fileData, index) {
            result[rootData.subResources[index]] = fileData;
          });
          // console.log('we have all the data', result)

          // FIXME : awfull hack
          // console.log('filesData', rootData.build)
          rootData.build = rootData.build.map(function (item, newIndex) {
            var id = item.objectid;
            var path = item.path;
            var resolvedPath = result[path];
            if (!resolvedPath) {
              return item;
            }
            var resolved = resolvedPath.objects[id];
            rootData.objects[newIndex] = resolved;
            return Object.assign({}, item, { objectid: newIndex });
          }).filter(function (x) {
            return x !== undefined;
          });

          // this always gets called, even if there are not sub resources
          onDone(rootData); //assembleStuff(rootData))
        });
      });
    });
  };
  return concat(finalCallback);
}