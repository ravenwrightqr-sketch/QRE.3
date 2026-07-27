/**
 * =====================================================
 * QRE CREATION ARCHITECTURE COMPILER
 * =====================================================
 *
 * Experience Genome
 *        ↓
 * Creation Architecture
 *
 * The system deciding:
 *
 * "How should meaning become structure?"
 *
 * =====================================================
 */


import type {

  ExperienceGenome,

} from "@qre/contracts";


import type {

  CreationArchitecture,

} from "./creationTypes.js";





export function compileCreationArchitecture(

  genome:ExperienceGenome

):CreationArchitecture {



const emotionalArc = [

  ...genome.emotions

];





const structuralPhases = [

  ...genome.journey

];





const symbolicElements:string[] = [];





if(

  genome.memory === 1

){

  symbolicElements.push(

    "preserved moment"

  );

}





if(

  genome.discovery === 1

){

  symbolicElements.push(

    "revealed unknown"

  );

}





if(

  genome.social === "community"

){

  symbolicElements.push(

    "shared experience"

  );

}





const interactionPatterns:string[] = [];





if(

 genome.social === "community"

){

 interactionPatterns.push(

  "collective participation"

 );

}

else

{

 interactionPatterns.push(

  "personal reflection"

 );

}





const preservationMechanisms:string[] = [];





if(

 genome.memory === 1

)

{

 preservationMechanisms.push(

  "memory capsule"

 );

}





if(

 genome.replay === 1

)

{

 preservationMechanisms.push(

  "revisitable journey"

 );

}





return {


 intention:

     genome.meaning.why,



 emotionalArc,



 structuralPhases,



 symbolicElements,



 interactionPatterns,



 preservationMechanisms



};



}





export const creationCompiler =

compileCreationArchitecture;