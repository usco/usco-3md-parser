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

  it("can parse 3mf files with multiple meshes and transforms in a build ", function(done) {
    this.timeout(5000)
    let data = fs.readFileSync("test/data/cube_gears.3mf",'binary')
    let obs  = parse(data)
   

    obs.forEach(function(parsed){
      //console.log("parsed",parsed.build)
      //console.log("parsed",JSON.stringify(parsed))
      assert.equal(Object.keys(parsed.objects).length,17)
      assert.equal(parsed.objects['1'].positions.length,5232)
      assert.equal(parsed.objects['1'].indices.length, 10452)

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