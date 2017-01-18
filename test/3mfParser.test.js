import test from 'ava'
import fs from 'fs'

import makeParsedStream from '../src/index'

/*test.cb('can parse 3mf files with simple geometry ', t => {
  fs.createReadStream('./data/box.3mf', { encoding: null, highWaterMark: 512 * 1024 }) // 'binary'
    .pipe(makeParsedStream())
    .on('data', function (parsed) {
      t.deepEqual(Object.keys(parsed.objects).length, 1)
      t.deepEqual(parsed.objects['1'].geometry.positions.length, 108)
      t.deepEqual(parsed.objects['1'].geometry.normals.length, 108)
      t.end()
    })
})*/

test.cb('can parse 3mf files with components ', t => {
  fs.createReadStream('./data/ghosts_II.3mf', { encoding: null, highWaterMark: 512 * 1024 }) // 'binary'
    .pipe(makeParsedStream())
    .on('data', function (parsed) {
      // console.log('parsed', parsed)


      //assembleStuff(parsed)
      console.log(parsed.objects)
      t.deepEqual(Object.keys(parsed.objects).length, 59)
      t.deepEqual(parsed.objects[62].components.length , 29)
      t.deepEqual(parsed.objects[4].geometry.positions.length, 108)
      t.deepEqual(parsed.objects[4].geometry.normals.length, 108)
      t.end()
    })
})

/*test.cb('can parse 3mf files and get their metadata ', t => {
  const exp = {
    Title: 'Three Cube Gears',
    Designer: 'Emmett Lalish',
    LicenseTerms: 'Creative Commons - Attribution - Share Alike',
    CreationDate: '2015-07-28',
    Description: 'http://www.thingiverse.com/thing:213946'
  }

  fs.createReadStream('./data/cube_gears.3mf', { encoding: null, highWaterMark: 512 * 1024 }) // 'binary'
    .pipe(makeParsedStream())
    .on('data', function (parsed) {
      t.deepEqual(parsed.metadata, exp)
      t.end()
    })
})

test.cb('can parse 3mf files with multiple meshes and transforms in a build ', t => {
  fs.createReadStream('./data/cube_gears.3mf', { encoding: null, highWaterMark: 512 * 1024 }) // 'binary'
    .pipe(makeParsedStream())
    .on('data', function (parsed) {
      t.deepEqual(Object.keys(parsed.objects).length, 17)
      t.deepEqual(parsed.build.length, 17)
      t.deepEqual(parsed.objects['1'].geometry.positions.length, 31356) // 5232)
      // t.deepEqual(parsed.objects['1'].indices.length, 10452)
      t.deepEqual(Array.from(parsed.build[0].transforms), [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, -20.046039581298828, 0, -20.010799407958984, 1]) // [1, 0, 0, 0, 1, 0, 0, 0, 1, -1.23762, 1.20238, -20.0108])
      t.deepEqual(Array.from(parsed.build[9].transforms), [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, -20.046039581298828, 0, -20.010799407958984, 1]) // [1, 0, 0, 0, 1, 0, 0, 0, 1, -1.23762, 1.20238, -20.0108])
      t.end()
    })
})

test.cb('can parse 3MF files with production specs (multiple mesh files in the container)', t => {
  fs.createReadStream('./data/a-simple-cube.3mf', { encoding: null, highWaterMark: 512 * 1024 }) // 'binary'
    .pipe(makeParsedStream())
    .on('data', function (parsed) {
      t.deepEqual(parsed.objects[0].geometry.positions.length, 11808)
      t.deepEqual(parsed.objects[0].name, 'Dopje')
      t.deepEqual(parsed.build, [ { objectid: 0 } ])
      t.end()
    })
})*/

/*test.cb('can parse 3mf files with color data ', t => {
  fs.createReadStream('./data/dodeca_chain_loop_color.3mf', { encoding: null, highWaterMark: 512 * 1024 }) // 'binary'
    .pipe(makeParsedStream({concat: true}))
    .on('data', function (parsed) {
      // console.log("parsed",parsed.objects['1'].indices.length,parsed.objects['1'].colors.length)
      // console.log("parsed",parsed.objects['1'].colors)
      t.deepEqual(parsed.colors, {'2': [
          [ 1, 0, 0.5, 1 ],
          [ 1, 1, 1, 1 ],
          [ 0.5, 0.5, 1, 1 ],
          [ 0, 1, 0.02, 1 ],
          [ 0.5, 0.25, 0, 1 ],
          [ 0.99, 0.87, 0.01, 1 ],
          [ 0, 1, 1, 1 ],
          [ 1, 0, 1, 1 ],
          [ 1, 1, 0, 1 ]
      ]})
      t.deepEqual(parsed.objects['1'].colors.length, 92160) // 12160)
      t.end()
    })
})

test.cb('can parse 3mf files with vertex color data ', t => {
  fs.createReadStream('./data/pyramid_vertexcolor.3mf', { encoding: null, highWaterMark: 512 * 1024 }) // 'binary'
    .pipe(makeParsedStream({concat: true}))
    .on('data', function (parsed) {
      // console.log("parsed",parsed.objects['1'].indices.length,parsed.objects['1'].geometry.positions.length)
      t.deepEqual(parsed.colors, {'2': [
          [ 1, 0, 0, 1 ],
          [ 0, 0, 1, 1 ],
          [ 0, 1, 0, 1 ],
        [ 1, 1, 1, 1 ] ]})

      t.deepEqual(parsed.objects['1'].colors.length, 48) // 16)

      t.end()
    })
})*/

// -------------------
/*test.cb("can parse 3mf files with complex geometry", , t => {
  this.timeout(10000)
  let data = fs.readFileSync("./data/heartgears.3mf",'binary')
  let obs  = parse(data)

  obs
    .filter( data => (!data.hasOwnProperty("progress")) ) //filter out progress information
    .forEach(function(parsed){
      t.deepEqual(parsed.build.length,1)
      t.deepEqual(parsed.objects['1'].geometry.positions.length,45558)
      t.deepEqual(parsed.objects['1'].indices.length, 91908)

      t.end()
    })
})*/
/*test.cb("should handle errors gracefully", t => {
  let data = {foo:42}
  let obs = parse(data) //we get an observable back

  obs.forEach(undefined, function(error){
    t.deepEqual(error.message,"First argument to DataView constructor must be an ArrayBuffer")
    t.end()
  })
})*/
