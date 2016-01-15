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

  it("can parse 3mf files with just geometry ", done => {
    this.timeout(5000)
    let data = fs.readFileSync("test/data/box.3mf",'binary')
    let obs  = parse(data)
   

    obs.forEach(function(parsed){
      console.log("parsed",parsed)
      //assert.equal(parsed.vertices.length/3,864) //we divide by three because each entry is 3 long
      //assert.equal(parsed.children[0].vertices.length, 12)
      //assert.equal(parsed.children[0].faces.length, 20)

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