/**
 * =====================================================
 * ORIGIN EVOLUTION ENGINE
 * =====================================================
 *
 * Detects meaningful change between states.
 *
 * Past Meaning
 *       +
 * Reflection
 *       +
 * New Meaning
 *       =
 * Evolution Path
 *
 * =====================================================
 */


export interface EvolutionState {

  previous:string[];

  current:string[];

  changes:string[];

  evolutionStrength:number;

}



export function evolve(

 previous:string[],

 current:string[]

):EvolutionState {


 const changes =

 current.filter(

  item =>

   !previous.includes(item)

 );


 return {


  previous,


  current,


  changes,


  evolutionStrength:

   current.length === 0

   ? 0

   :

   changes.length / current.length


 };


}