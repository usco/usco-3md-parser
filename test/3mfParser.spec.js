import assert from 'assert'
//import fs from 'fs' //does not work with babel + brfs
const fs = require('fs')

//these two are needed by the parser
//import Rx from 'rx'
//let Rx = require('rx')
import assign from 'fast.js/object/assign'
import parse, {outputs} from '../src/index' 
//import parse, {outputs}'../lib/stl-parser'





describe("3MF parser", function() {
  //console.log("Parser outputs", outputs, parse)

  it("can parse 3mf files with simple geometry ", function(done) {
    this.timeout(3000)
    let data = fs.readFileSync("test/data/box.3mf",'binary')
    let obs  = parse(data)
   

    obs.subscribe(
      function(parsed){
        assert.equal(Object.keys(parsed.objects).length,1)
        assert.equal(parsed.objects['1'].positions.length,24)
        assert.equal(parsed.objects['1'].indices.length, 36)

        done()
      }
      ,function(error){
        console.log("error in parsing",error)
      }
      ,function(){
        console.log("Completed")
      }
    )
  })

  it("can parse 3mf files with complex geometry", function(done) {
    this.timeout(5000)
    let data = fs.readFileSync("test/data/heartgears.3mf",'binary')
    let obs  = parse(data)
   
    obs.forEach(function(parsed){
      assert.equal(parsed.build.length,1)
      assert.equal(parsed.objects['1'].positions.length,45558)//45558)//TODO: double check this
      assert.equal(parsed.objects['1'].indices.length, 91908)

      done()
    })
  })

  it("can parse 3mf files and get their metadata ", function(done) {
    this.timeout(5000)
    let data = fs.readFileSync("test/data/cube_gears.3mf",'binary')
    let obs  = parse(data)
   
    let exp = { 
      Title: 'Three Cube Gears',
      Designer: 'Emmett Lalish',
      LicenseTerms: 'Creative Commons - Attribution - Share Alike',
      CreationDate: '2015-07-28',
      Description: 'http://www.thingiverse.com/thing:213946' 
    }

    obs.subscribe(
      function(parsed){
        assert.deepEqual(parsed.metadata, exp)

        done()
      }
      ,function(error){
        console.log("error in parsing",error)
      }
      ,function(){
        console.log("Completed")
      }
    )
  })

  it("can parse 3mf files with multiple meshes and transforms in a build ", function(done) {
    this.timeout(5000)
    let data = fs.readFileSync("test/data/cube_gears.3mf",'binary')
    let obs  = parse(data)

    obs.forEach(function(parsed){
      assert.equal(Object.keys(parsed.objects).length,17)
      assert.equal(parsed.build.length,17)
      assert.equal(parsed.objects['1'].positions.length,5232)
      assert.equal(parsed.objects['1'].indices.length, 10452)

      //console.log("parsed",parsed.build)

      assert.deepEqual(parsed.build[0].transforms, [1, 0, 0, 0, 1, 0, 0, 0, 1, -1.23762, 1.20238, -20.0108] )
      assert.deepEqual(parsed.build[9].transforms, [1, 0, 0, 0, 1, 0, 0, 0, 1, -1.23762, 1.20238, -20.0108] )

      done()
    })
  })


  /*  it("should handle errors gracefully", done => {
    let data = {foo:"42"}
    let obs = parse(data) //we get an observable back

    obs.forEach(undefined, function(error){
      assert.equal(error.message,"First argument to DataView constructor must be an ArrayBuffer")
      done()
    })
  })*/

})