/**
 * =====================================================
 * QRE NOVA FIELD
 * =====================================================
 *
 * Creative ignition layer.
 *
 * ORION discovers semantic gravity.
 *
 * NOVA amplifies that gravity into
 * creative direction.
 *
 * NO DATABASE
 * NO EXECUTION
 * NO RUNTIME
 *
 * =====================================================
 */

import type {
  OrionField
} from "../orion/index.js";



export interface NovaField {

  /**
   * Dominant creative force
   * emerging from semantic gravity.
   */
  creativeGravity:string;


  /**
   * Creative tensions that should
   * naturally exist inside the experience.
   */
  creativeTensions:string[];


  /**
   * Creative vectors available to
   * downstream compilers.
   */
  vectors:string[];


  /**
   * Overall semantic intensity.
   */
  intensity:number;

}





function unique(

 values:string[] = []

):string[]{

 return [

  ...new Set(

   values.filter(Boolean)

  )

 ];

}





export function awakenNova(

 orion:OrionField

):NovaField {


 const vectors = unique([

  ...(orion.coreVector ?? [])

 ]);



 const creativeGravity =

  vectors.length

   ? vectors.join(" → ")

   : "emergent meaning";



 const creativeTensions = unique([

  ...vectors,

  creativeGravity

 ]);



 return {

  creativeGravity,

  creativeTensions,

  vectors,

  intensity:

   orion.gravity

 };


}



export const novaField =

awakenNova;