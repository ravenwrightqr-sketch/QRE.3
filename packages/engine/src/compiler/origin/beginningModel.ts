/**
 * =====================================================
 * ORIGIN WORLD MODEL
 * =====================================================
 *
 * Internal representation of a possible experience world.
 *
 * No runtime.
 * No database.
 *
 * =====================================================
 */


import type {
  OriginField,
} from "./originField.js";



export interface BeginningModel {

  entities:string[];

  concepts:string[];

  relationships:string[];

  tensions:string[];

}




export function buildBeginningModel(

  origin:OriginField

):BeginningModel {


  return {

    entities:[],


    concepts:
      origin.sourceMeaning,


    relationships:
      origin.worldState,


    tensions:
      origin.unknowns,

  };

}