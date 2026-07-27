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



export interface WorldModel {

  entities:string[];

  concepts:string[];

  relationships:string[];

  tensions:string[];

}




export function buildWorldModel(

  origin:OriginField

):WorldModel {


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