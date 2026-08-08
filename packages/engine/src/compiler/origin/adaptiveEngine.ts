/**
 * =====================================================
 * ORIGIN ADAPTIVE EVOLUTION ENGINE
 * =====================================================
 *
 * Resonance
 *      ↓
 * Semantic Evolution
 *
 * Determines how meaning naturally evolves
 * from accumulated resonance.
 *
 * NO TEMPLATES
 * NO RULE TREES
 *
 * =====================================================
 */

export interface AdaptiveEvolution{

  previousTrajectory:string[];

  emergingTrajectory:string[];

  adaptationDrivers:string[];

  evolutionNarrative:string;

  evolutionForce:number;

}





function unique(

 values:string[]=[]

):string[]{

 return [

  ...new Set(

   values.filter(Boolean)

  )

 ];

}





export function evolveMeaning(

 resonance:{

  connectedPatterns?:string[];

  futureSignal?:string;

  resonanceStrength:number;

 }

):AdaptiveEvolution{


 const drivers =

  unique([

   ...(resonance.connectedPatterns ?? []),

   resonance.futureSignal ?? ""

  ]);



 const previousTrajectory =

  resonance.connectedPatterns?.length

  ? [...resonance.connectedPatterns]

  : ["initial meaning"];



 const emergingTrajectory =

  unique([

   ...previousTrajectory,

   resonance.futureSignal ?? "semantic emergence"

  ]);



 const evolutionNarrative =

  emergingTrajectory.length > 1

  ? `Meaning evolves through ${emergingTrajectory.join(" → ")}.`

  : `Meaning stabilizes around ${emergingTrajectory[0]}.`;



 return {

  previousTrajectory,



  emergingTrajectory,



  adaptationDrivers:

   drivers,



  evolutionNarrative,



  evolutionForce:

   resonance.resonanceStrength

 };


}