import Rx from 'rx'
let fromEvent = Rx.Observable.fromEvent
let Observable = Rx.Observable
let merge = Rx.Observable.merge
let just  = Rx.Observable.just

import assign from 'fast.js/object/assign'//faster object.assign

//TODO: this needs to be an external lib, for re-use
//merge the current data with any number of input data
export function mergeData(currentData, ...inputs){
  if("merge" in currentData){
    return currentData.merge(inputs)
  }
  return assign({}, currentData, ...inputs)
}

//need to make sure source data structure is right 
export function applyDefaults(data$, defaults){
  return data$.map(function(data){
    return mergeData(defaults,data)
  })
}

//need to make sure the "type" (immutable) is right 
export function applyTransform(data$, transform){
  return data$.map(function(data){
    return transform(data)
  })
}


export function makeModifications(actions, updateFns, options){

  let mods$ =  Object.keys(actions).map(function(key){
    let op     = actions[key]
    let opName = key.replace(/\$/g, "")
    let modFn  = updateFns[opName]

    //here is where the "magic happens"
    //for each "operation/action" we map it to an observable with history & state
    let mod$   = op
      .map((input) => (state) => {
        state   = modFn(state, input)//call the adapted function
        return state
      })

    if(modFn){
      return mod$ 
    }
  })
  .filter( e=> e!==undefined )

  return merge(
    mods$
  )
}



export function makeModel(defaults, updateFns, actions, source, options={doApplyTransform:false} ){
  let mods$ =  makeModifications(actions, updateFns, options)
  
  let source$ = source || just( defaults)

  source$ = applyDefaults(source$, defaults)

  if(options.doApplyTransform){
    source$ = applyTransform( source$, transform )
  }

  return mods$
    .merge(source$)
    .scan((currentData, modFn) => modFn(currentData))//combine existing data with new one
    //.distinctUntilChanged()
    //.shareReplay(1)
}


/*function makeUpdateFn$(rawData$) {


  }

  function model(rawData$, actions) {
    const defaults = {

    }
    const updateFn$ = makeUpdateFn$(rawData$)
    const state$ = updateFn$
      .startWith(defaults)
      .scan(smartStateFold)
    return state$
  }*/


  /* smartStateFold(prev, curr) {
    if (typeof curr === 'function') {
      return curr(prev);
    } else {
      return curr;
    }
  },*/