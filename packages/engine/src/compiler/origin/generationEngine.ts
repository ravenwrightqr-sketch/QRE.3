/**
 * =====================================================
 * ORIGIN GENERATION ENGINE
 * =====================================================
 *
 * Semantic Evolution
 *        ↓
 * Future Intention
 *        ↓
 * Experience Direction
 *
 * Generates possible next meaning states.
 *
 * NO TEMPLATES
 * NO FIXED PURPOSES
 *
 * =====================================================
 */


export interface GeneratedFuture {


  intent:string[];


  purpose:string[];


  direction:string[];


  emergingPossibilities:string[];


  confidence:number;


}







function unique(

 values:string[] = []

):string[] {


 return [

  ...new Set(

   values.filter(Boolean)

  )

 ];

}








export function generateFuture(

 evolution:{

  previousTrajectory?:string[];

  emergingTrajectory?:string[];

  adaptationDrivers?:string[];

  evolutionNarrative?:string;

  evolutionForce?:number;

 }

):GeneratedFuture {



 const emerged =

  unique(

   evolution.emergingTrajectory

   ?? []

  );





 const preserved =

  unique(

   evolution.previousTrajectory

   ?? []

  );





 const transformed =

  unique(

   evolution.adaptationDrivers

   ?? []

  );







 const intent =

  unique([

   ...emerged,

   ...transformed

  ]);







 const purpose =

  unique([

   ...preserved,

   ...emerged

  ]);







 const direction =

  unique([

   ...transformed,

   ...emerged,

   ...preserved

  ]);








 return {


  intent:


   intent.length

   ? intent

   :

   [

    "semantic exploration"

   ],





  purpose:


   purpose.length

   ? purpose

   :

   [

    "continue meaning development"

   ],





  direction:


   direction.length

   ? direction

   :

   [

    "observe emerging possibilities"

   ],





  emergingPossibilities:


   emerged,





  confidence:


   evolution.evolutionForce

   ??

   0.5



 };

}