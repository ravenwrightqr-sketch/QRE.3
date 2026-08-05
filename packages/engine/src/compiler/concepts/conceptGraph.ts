/**
 * =====================================================
 * QRE MEANING CONSTELLATION
 * =====================================================
 *
 * Concepts
 *      ↓
 * Relationships
 *      ↓
 * Experience Meaning Structure
 *
 * No templates.
 * No industries.
 * No execution.
 *
 * =====================================================
 */

import type {
  ExperienceConcept,
  ConceptConstellation,
  ConceptConnection,
} from "@qre/contracts";




export function buildConceptConstellation(

 concepts: ExperienceConcept[]

):ConceptConstellation {



const connections:

ConceptConnection[] = [];





if(

 concepts.includes("memory")

 &&

 concepts.includes("connection")

){


connections.push({

 from:"memory",

 to:"connection",

 relationship:"preserves"

});


}




if(

 concepts.includes("discovery")

 &&

 concepts.includes("identity")

){


connections.push({

 from:"discovery",

 to:"identity",

 relationship:"reveals"

});


}




if(

 concepts.includes("transformation")

 &&

 concepts.includes("discovery")

){


connections.push({

 from:"discovery",

 to:"transformation",

 relationship:"creates"

});


}




return {


concepts,


connections



};



}



export const meaningConstellation =

buildConceptConstellation;