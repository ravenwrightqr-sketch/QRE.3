/**
 * =====================================================
 * ORIGIN LOOP
 * =====================================================
 *
 * Meaning State Processor
 *
 * Origin
 *    ↓
 * World
 *    ↓
 * Memory
 *    ↓
 * Reflection
 *    ↓
 * Evolution
 *
 * =====================================================
 */

import {

  buildWorldModel

} from "./worldModel.js";


import {

  buildMemoryField

} from "./memoryField.js";


import {

  reflect

} from "./reflectionEngine.js";


import {

  evolve

} from "./evolutionEngine.js";


import type {

 OriginField

} from "./originField.js";





export interface OriginState {

 world:any;

 memory:any;

 reflection:any;

 evolution:any;

}




export function runOriginLoop(

 origin:OriginField

):OriginState {



 const world =

 buildWorldModel(
  origin
 );


 const memory =

 buildMemoryField(

  world.concepts,

  origin.worldState

 );


 const reflection =

 reflect(

  world.concepts

 );


 const evolution =

 evolve(

  origin.sourceMeaning,

  [
    ...world.concepts,
    ...memory.futureEchoes
  ]

 );



 return {

  world,

  memory,

  reflection,

  evolution

 };


}